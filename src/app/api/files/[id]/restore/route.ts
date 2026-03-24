import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { getAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

/** POST - Restore file from trash */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await getAuthUser(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;
  const { id } = await params;

  const admin = getAdminClient();

  // Fetch file (need service role to see soft-deleted files through RLS)
  const { data: file, error: fetchError } = await admin
    .from("files")
    .select("id, owner_id, deleted_at")
    .eq("id", id)
    .single();

  if (fetchError || !file) return apiError("File not found", 404);
  if (file.owner_id !== user.id) return apiError("Forbidden", 403);
  if (!file.deleted_at) return apiError("File is not in trash", 400);

  const { error } = await admin
    .from("files")
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) return apiError("Failed to restore file", 500);

  return apiSuccess({ success: true, message: "File restored" });
}
