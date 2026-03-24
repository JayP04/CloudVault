import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { uploadRequestSchema } from "@/lib/validations/schemas";
import {
  generateStorageKey,
  generateThumbnailKey,
  getUploadUrl,
} from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  // Validate input
  const body = await request.json().catch(() => null);
  const parsed = uploadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message);
  }

  const { filename, mime_type, file_size, exif_date } = parsed.data;

  // Check storage quota
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("storage_used_bytes, storage_quota_bytes")
    .eq("id", user.id)
    .single();

  if (profile) {
    const projectedUsage = profile.storage_used_bytes + file_size;
    if (projectedUsage > profile.storage_quota_bytes) {
      return apiError("Storage quota exceeded", 413);
    }
  }

  // Generate keys
  const fileId = crypto.randomUUID();
  const storageKey = generateStorageKey(user.id, fileId);
  const thumbnailKeys = {
    sm: generateThumbnailKey(user.id, fileId, "sm"),
    md: generateThumbnailKey(user.id, fileId, "md"),
  };

  // Generate presigned upload URL
  const uploadUrl = await getUploadUrl(storageKey, mime_type);

  return apiSuccess({
    upload_url: uploadUrl,
    file_id: fileId,
    storage_key: storageKey,
    thumbnail_keys: thumbnailKeys,
  });
}
