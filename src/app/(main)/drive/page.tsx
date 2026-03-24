import { createClient } from "@/lib/supabase/server";
import { FileList } from "@/components/drive/file-list";
import type { FileRecord } from "@/types";

export default async function DrivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: files } = await supabase
    .from("files")
    .select("*")
    .order("effective_date", { ascending: false })
    .limit(200);

  const typedFiles = (files ?? []) as FileRecord[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-white">Files</h1>
        <p className="text-[13px] text-[#98989d] mt-1">All your uploaded files.</p>
      </div>

      {typedFiles.length > 0 ? (
        <FileList files={typedFiles} />
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2c2c2e] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#636366]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <p className="text-[#98989d] text-sm">No files yet. Upload documents, PDFs, or any file type.</p>
        </div>
      )}
    </div>
  );
}
