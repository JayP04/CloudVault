import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { uploadConfirmSchema } from "@/lib/validations/schemas";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  // Validate input
  const body = await request.json().catch(() => null);
  const parsed = uploadConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message);
  }

  const { file_id, storage_key, thumbnail_key, blur_hash, metadata } =
    parsed.data;

  // Verify the storage key belongs to this user
  if (!storage_key.startsWith(`vault/${user.id}/`)) {
    return apiError("Invalid storage key", 403);
  }

  // Insert file record
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files")
    .insert({
      id: file_id,
      owner_id: user.id,
      storage_key,
      thumbnail_key,
      original_filename: metadata.original_filename,
      mime_type: metadata.mime_type,
      file_size: metadata.file_size,
      width: metadata.width,
      height: metadata.height,
      blur_hash,
      original_created_at: metadata.original_created_at,
      effective_date: metadata.effective_date,
      location_lat: metadata.location_lat,
      location_lng: metadata.location_lng,
    })
    .select()
    .single();

  if (error) {
    console.error("Database insert error:", error);
    return apiError("Failed to save file metadata", 500);
  }

  return apiSuccess({ file: data }, 201);
}
