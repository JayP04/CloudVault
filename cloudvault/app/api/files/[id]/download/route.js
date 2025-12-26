import { createClient } from '@/lib/supabase/server'
import { getR2Client, R2_BUCKET_NAME } from '@/lib/storage/r2'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const fileId = resolvedParams.id

    // Get file metadata
    const { data: file, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check permissions
    const isOwner = file.owner_id === user.id
    if (!isOwner) {
      const { data: permission } = await supabase
        .from('file_permissions')
        .select('*')
        .eq('file_id', fileId)
        .eq('user_id', user.id)
        .single()

      if (!permission) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get file from R2
    const r2Client = getR2Client()
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: file.storage_key,
    })

    const response = await r2Client.send(command)
    
    // Convert stream to array buffer
    const chunks = []
    for await (const chunk of response.Body) {
      chunks.push(chunk)
    }
    const arrayBuffer = Buffer.concat(chunks)

    // Sanitize filename - remove special characters
    const safeFilename = file.original_filename.replace(/[^\x00-\x7F]/g, '')

    // Return file with download headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': file.mime_type,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': arrayBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}