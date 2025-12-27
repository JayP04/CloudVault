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
      return NextResponse.redirect(new URL('/login?from=share', request.url))
    }

    const formData = await request.formData()
    const files = formData.getAll('media')

    if (files.length === 0) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Process each shared file
    let uploadedCount = 0
    
    for (const file of files) {
      try {
        // Generate unique storage key
        const fileId = crypto.randomUUID()
        const storageKey = `vault/${user.id}/${fileId}`
        
        // Use current date as effective date (we can't extract EXIF server-side easily)
        const effectiveDate = new Date().toISOString()

        // Generate signed upload URL for R2
        const r2Client = getR2Client()
        const command = new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: storageKey,
          ContentType: file.type,
        })

        const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })

        // Upload file to R2
        const arrayBuffer = await file.arrayBuffer()
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: arrayBuffer,
          headers: {
            'Content-Type': file.type,
          },
        })

        if (!uploadResponse.ok) {
          console.error('Failed to upload to R2')
          continue
        }

        // Save metadata to database
        const { error } = await supabase
          .from('files')
          .insert({
            id: fileId,
            owner_id: user.id,
            storage_key: storageKey,
            original_filename: file.name || `shared-${Date.now()}.jpg`,
            mime_type: file.type,
            file_size: file.size,
            original_created_at: null,
            effective_date: effectiveDate,
          })

        if (!error) {
          uploadedCount++
        }
      } catch (error) {
        console.error('Error uploading shared file:', error)
      }
    }

    // Redirect to dashboard with success message
    const redirectUrl = new URL('/dashboard', request.url)
    if (uploadedCount > 0) {
      redirectUrl.searchParams.set('uploaded', uploadedCount)
    }
    
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Share upload error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=upload-failed', request.url))
  }
}