import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { PhotoGrid } from "@/components/gallery/photo-grid";
import type { FileRecord } from "@/types";

export default async function TrashPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Use admin client to see soft-deleted files (RLS filters by deleted_at)
  const admin = getAdminClient();
  const { data: files } = await admin
    .from("files")
    .select("*")
    .eq("owner_id", user.id)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  const typedFiles = (files ?? []) as FileRecord[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-white">Recently Deleted</h1>
        <p className="text-[13px] text-[#98989d] mt-1">
          Items are permanently deleted after 30 days.
        </p>
      </div>

      {typedFiles.length > 0 ? (
        <PhotoGrid initialFiles={typedFiles} initialCursor={null} showDaysLeft />
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2c2c2e] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#636366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </div>
          <p className="text-[#98989d] text-sm">Trash is empty.</p>
        </div>
      )}
    </div>
  );
}
