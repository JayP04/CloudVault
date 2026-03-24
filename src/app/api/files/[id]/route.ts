import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH - Update file (toggle favorite, etc.) */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await getAuthUser(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return apiError("Invalid request body");
  }

  // Only allow specific fields to be updated
  const allowedFields: Record<string, unknown> = {};
  if (typeof body.is_favorite === "boolean") {
    allowedFields.is_favorite = body.is_favorite;
  }

  if (Object.keys(allowedFields).length === 0) {
    return apiError("No valid fields to update");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("files")
    .update(allowedFields)
    .eq("id", id);

  if (error) {
    return apiError("Failed to update file", 500);
  }

  return apiSuccess({ success: true });
}

/** DELETE - Soft delete (move to trash) */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await getAuthUser(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const supabase = await createClient();
  const { error } = await supabase
    .from("files")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return apiError("Failed to delete file", 500);
  }

  return apiSuccess({ success: true, message: "Moved to trash" });
}
