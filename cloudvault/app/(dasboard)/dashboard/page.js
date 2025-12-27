import { createClient } from '@/lib/supabase/server'
import UploadButton from '@/components/UploadButton'
import PhotoGallery from '@/components/PhotoGallery'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's files
  const { data: myFiles } = await supabase
    .from('files')
    .select('*')
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .order('effective_date', { ascending: false })

  const uploadedcontent = searchParams?.uploaded ? parseInt(searchParams.uploaded) : null

  return (
    <div className="space-y-8">
      {/* Upload Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Photos</h1>
        <UploadButton />
      </div>

      {/* Photo Gallery */}
      {myFiles && myFiles.length > 0 ? (
        <PhotoGallery files={myFiles} />
      ) : (
        <div className="bg-white shadow rounded-lg px-6 py-12 text-center">
          <p className="text-gray-500">No photos yet. Upload your first photo to get started!</p>
        </div>
      )}
    </div>
  )
}