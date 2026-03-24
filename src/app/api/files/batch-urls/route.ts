import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { batchUrlsSchema } from "@/lib/validations/schemas";
import { createClient } from "@/lib/supabase/server";
import { getDownloadUrl } from "@/lib/storage/r2";

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = batchUrlsSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0].message);

  const { file_ids } = parsed.data;

  const supabase = await createClient();
  const { data: files, error } = await supabase
    .from("files")
    .select("id, storage_key")
    .in("id", file_ids);

  if (error) return apiError("Failed to fetch files", 500);

  const urls: Record<string, string> = {};

  await Promise.all(
    (files ?? []).map(async (file) => {
      try {
        urls[file.id] = await getDownloadUrl(file.storage_key);
      } catch {
        // skip
      }
    })
  );

  return apiSuccess({ urls });
}