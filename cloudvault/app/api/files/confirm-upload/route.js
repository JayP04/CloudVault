import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileId, storageKey, metadata } = body

    // Save file metadata to database
    const { data, error } = await supabase
      .from('files')
      .insert({
        id: fileId,
        owner_id: user.id,
        storage_key: storageKey,
        original_filename: metadata.original_filename,
        mime_type: metadata.mime_type,
        file_size: metadata.file_size,
        original_created_at: metadata.original_created_at,
        effective_date: metadata.effective_date,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 })
    }

    return NextResponse.json({ success: true, file: data })
  } catch (error) {
    console.error('Confirm upload error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm upload' },
      { status: 500 }
    )
  }
}