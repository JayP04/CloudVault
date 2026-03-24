import { createClient } from "@/lib/supabase/server";
import { PhotoGrid } from "@/components/gallery/photo-grid";
import type { FileRecord } from "@/types";

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Initial page load — first batch of photos
  const { data: files, error } = await supabase
    .from("files")
    .select("*")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("effective_date", { ascending: false })
    .limit(50);

  const typedFiles = (files ?? []) as FileRecord[];
  const cursor =
    typedFiles.length === 50
      ? typedFiles[typedFiles.length - 1].effective_date
      : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-white">Library</h1>
      </div>

      {typedFiles.length > 0 ? (
        <PhotoGrid initialFiles={typedFiles} initialCursor={cursor} />
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2c2c2e] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#636366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
          <p className="text-[#98989d] text-sm">
            No photos yet. Upload your first photo to get started.
          </p>
        </div>
      )}
    </div>
  );
}
