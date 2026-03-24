import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const admin = getAdminClient();

  // Get the Google Photos source
  const { data: source } = await admin
    .from("import_sources")
    .select("id, is_connected")
    .eq("user_id", user.id)
    .eq("provider", "google_photos")
    .maybeSingle();

  if (!source) {
    return apiSuccess({ connected: false, job: null });
  }

  // Get the latest import job for this source
  const { data: job } = await admin
    .from("import_jobs")
    .select(
      "id, status, total_items, processed_items, failed_items, bytes_imported, started_at, completed_at, error_message"
    )
    .eq("user_id", user.id)
    .eq("source_id", source.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return apiSuccess({
    connected: source.is_connected,
    job: job
      ? {
          id: job.id,
          status: job.status,
          totalItems: job.total_items,
          processedItems: job.processed_items,
          failedItems: job.failed_items,
          bytesImported: job.bytes_imported,
          startedAt: job.started_at,
          completedAt: job.completed_at,
          errorMessage: job.error_message,
        }
      : null,
  });
}
