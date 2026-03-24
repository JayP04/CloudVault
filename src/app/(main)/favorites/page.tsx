import { createClient } from "@/lib/supabase/server";
import { PhotoGrid } from "@/components/gallery/photo-grid";
import type { FileRecord } from "@/types";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: files } = await supabase
    .from("files")
    .select("*")
    .eq("owner_id", user.id)
    .eq("is_favorite", true)
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
      <h1 className="text-[22px] font-bold text-white mb-6">Favorites</h1>

      {typedFiles.length > 0 ? (
        <PhotoGrid initialFiles={typedFiles} initialCursor={cursor} />
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2c2c2e] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#636366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <p className="text-[#98989d] text-sm">
            No favorites yet. Tap the heart on any photo to add it here.
          </p>
        </div>
      )}
    </div>
  );
}
