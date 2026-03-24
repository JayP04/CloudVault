import { createClient } from "@/lib/supabase/server";
import type { Album } from "@/types";

export default async function AlbumsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: albums } = await supabase
    .from("albums")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  const typedAlbums = (albums ?? []) as Album[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-white">Albums</h1>
        {/* TODO: Create album button */}
      </div>

      {typedAlbums.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {typedAlbums.map((album) => (
            <div
              key={album.id}
              className="group cursor-pointer"
            >
              <div className="aspect-square bg-[#2c2c2e] rounded-xl overflow-hidden mb-2">
                {/* TODO: Album cover image */}
                <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#636366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-white truncate">
                {album.name}
              </p>
              <p className="text-xs text-[#98989d]">{album.item_count} items</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2c2c2e] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#636366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <p className="text-[#98989d] text-sm">
            No albums yet. Create one to organize your photos.
          </p>
        </div>
      )}
    </div>
  );
}
