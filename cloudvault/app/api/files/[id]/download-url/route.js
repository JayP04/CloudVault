import { createClient } from '@/lib/supabase/server'
import { getR2Client, R2_BUCKET_NAME } from '@/lib/storage/r2'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
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

    // Get file metadata from database
    const { data: file, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if user owns the file OR has read permission
    const isOwner = file.owner_id === user.id

    if (!isOwner) {
      // Check for read permission
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

    // Generate signed download URL
    const r2Client = getR2Client()
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: file.storage_key,
    })

    const downloadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })

    return NextResponse.json({
      url: downloadUrl,
      filename: file.original_filename,
      mimeType: file.mime_type,
    })
  } catch (error) {
    console.error('Download URL error:', error)
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}