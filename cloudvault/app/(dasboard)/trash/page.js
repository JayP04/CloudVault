import { createClient as createBrowserClient } from '@supabase/supabase-js'
import TrashGallery from '@/components/TrashGallery'

// Create service role client (bypasses RLS to see deleted files)
function createServiceClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export default async function TrashPage() {
  // Get current user with regular client
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Unauthorized</div>
  }

  // Use service role to fetch deleted files
  const serviceSupabase = createServiceClient()
  const { data: deletedFiles } = await serviceSupabase
    .from('files')
    .select('*')
    .eq('owner_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  // Calculate days until permanent deletion
  const filesWithDaysLeft = deletedFiles?.map(file => {
    const deletedDate = new Date(file.deleted_at)
    const expiryDate = new Date(deletedDate)
    expiryDate.setDate(expiryDate.getDate() + 30)
    
    const today = new Date()
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
    
    return {
      ...file,
      daysLeft: Math.max(0, daysLeft),
      expiryDate: expiryDate.toLocaleDateString()
    }
  }) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trash</h1>
        <p className="mt-2 text-sm text-gray-600">
          Items in trash will be permanently deleted after 30 days
        </p>
      </div>

      {filesWithDaysLeft.length > 0 ? (
        <TrashGallery files={filesWithDaysLeft} />
      ) : (
        <div className="bg-white shadow rounded-lg px-6 py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <p className="mt-4 text-gray-500">Trash is empty</p>
        </div>
      )}
    </div>
  )
}