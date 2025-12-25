import { createClient } from '@/lib/supabase/server'
import { getR2Client, R2_BUCKET_NAME } from '@/lib/storage/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { filename, mimeType, fileSize, exifDate } = body

    // Validate file metadata
    if (!filename || !mimeType || !fileSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check storage quota (optional - we can add this later)
    // For now, we'll skip quota checks

    // Generate unique storage key
    const fileId = crypto.randomUUID()
    const storageKey = `vault/${user.id}/${fileId}`

    // Calculate effective date
    const effectiveDate = exifDate || new Date().toISOString()

    // Generate signed upload URL for R2
    const r2Client = getR2Client()
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storageKey,
      ContentType: mimeType,
    })

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 }) // 1 hour

    // Return upload URL and file metadata
    return NextResponse.json({
      uploadUrl,
      fileId,
      storageKey,
      metadata: {
        original_filename: filename,
        mime_type: mimeType,
        file_size: fileSize,
        original_created_at: exifDate || null,
        effective_date: effectiveDate,
      },
    })
  } catch (error) {
    console.error('Upload request error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}