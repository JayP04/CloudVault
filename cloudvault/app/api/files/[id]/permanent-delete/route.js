import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { getR2Client, R2_BUCKET_NAME } from '@/lib/storage/r2'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

// Create service role client (bypasses RLS)
function createServiceClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function DELETE(request, { params }) {
  try {
    // First, verify the user is authenticated with regular client
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const fileId = resolvedParams.id

    // Use service role client to access deleted files
    const serviceSupabase = createServiceClient()

    // Get file metadata
    const { data: file, error: fetchError } = await serviceSupabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if user is the owner
    if (file.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only file owner can delete' }, { status: 403 })
    }

    // Check if file is in trash
    if (!file.deleted_at) {
      return NextResponse.json({ error: 'File must be in trash before permanent deletion' }, { status: 400 })
    }

    // Delete from R2
    try {
      const r2Client = getR2Client()
      const deleteCommand = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: file.storage_key,
      })
      await r2Client.send(deleteCommand)
    } catch (r2Error) {
      console.error('R2 delete error:', r2Error)
      // Continue even if R2 delete fails
    }

    // Delete from database (this will cascade delete permissions)
    const { error: deleteError } = await serviceSupabase
      .from('files')
      .delete()
      .eq('id', fileId)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete file permanently' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'File permanently deleted' })
  } catch (error) {
    console.error('Permanent delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file permanently' },
      { status: 500 }
    )
  }
}