import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { getAdminClient } from "@/lib/supabase/admin";
import { deleteObjects } from "@/lib/storage/r2";

type RouteContext = { params: Promise<{ id: string }> };

/** DELETE - Permanently delete file from R2 and database */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await getAuthUser(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;
  const { id } = await params;

  const admin = getAdminClient();

  // Fetch file (need admin to see soft-deleted files)
  const { data: file, error: fetchError } = await admin
    .from("files")
    .select("id, owner_id, storage_key, thumbnail_key, deleted_at")
    .eq("id", id)
    .single();

  if (fetchError || !file) return apiError("File not found", 404);
  if (file.owner_id !== user.id) return apiError("Forbidden", 403);
  if (!file.deleted_at) return apiError("File must be in trash first", 400);

  // Collect all R2 keys to delete (original + thumbnails)
  const keysToDelete = [file.storage_key];
  if (file.thumbnail_key) {
    keysToDelete.push(file.thumbnail_key);
    keysToDelete.push(file.thumbnail_key.replace("thumb_sm", "thumb_md"));
  }

  // Delete from R2 (don't fail if R2 delete fails — orphaned objects are acceptable)
  try {
    await deleteObjects(keysToDelete);
  } catch (err) {
    console.error("R2 delete error (non-fatal):", err);
  }

  // Delete from database (cascades to album_items, shared_links)
  const { error: dbError } = await admin
    .from("files")
    .delete()
    .eq("id", id);

  if (dbError) return apiError("Failed to delete file", 500);

  return apiSuccess({ success: true, message: "Permanently deleted" });
}
