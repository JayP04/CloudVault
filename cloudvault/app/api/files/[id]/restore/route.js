import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create service role client (bypasses RLS)
function createServiceClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(request, { params }) {
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

    // Get file metadata (including deleted files)
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
      return NextResponse.json({ error: 'Only file owner can restore' }, { status: 403 })
    }

    // Check if file is actually deleted
    if (!file.deleted_at) {
      return NextResponse.json({ error: 'File is not in trash' }, { status: 400 })
    }

    // Restore: set deleted_at back to null
    const { error: restoreError } = await serviceSupabase
      .from('files')
      .update({ deleted_at: null })
      .eq('id', fileId)

    if (restoreError) {
      console.error('Restore error:', restoreError)
      return NextResponse.json({ error: 'Failed to restore file' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'File restored' })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json(
      { error: 'Failed to restore file' },
      { status: 500 }
    )
  }
}