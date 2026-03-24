import { createClient } from "@/lib/supabase/server";
import { PhotoGrid } from "@/components/gallery/photo-grid";
import type { FileRecord } from "@/types";

export default async function RecentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data: files } = await supabase
    .from("files")
    .select("*")
    .gte("uploaded_at", thirtyDaysAgo)
    .order("uploaded_at", { ascending: false })
    .limit(200);

  const typedFiles = (files ?? []) as FileRecord[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-white">Recents</h1>
        <p className="text-[13px] text-[#98989d] mt-1">Photos from the last 30 days.</p>
      </div>

      {typedFiles.length > 0 ? (
        <PhotoGrid initialFiles={typedFiles} initialCursor={null} />
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2c2c2e] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#636366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[#98989d] text-sm">No recent photos.</p>
        </div>
      )}
    </div>
  );
}
