import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  listMediaItems,
  refreshAccessToken,
  type GoogleMediaItem,
} from "@/lib/google-photos";
import { generateStorageKey, uploadBuffer } from "@/lib/storage/r2";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const admin = getAdminClient();

  // Get the connected Google Photos source
  const { data: source, error: sourceErr } = await admin
    .from("import_sources")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "google_photos")
    .eq("is_connected", true)
    .single();

  if (sourceErr || !source) {
    return apiError("Google Photos not connected", 400);
  }

  // Check for existing running job
  const { data: existingJob } = await admin
    .from("import_jobs")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("source_id", source.id)
    .eq("status", "running")
    .maybeSingle();

  if (existingJob) {
    return apiError("Import already in progress", 409);
  }

  // Refresh token if expired
  let accessToken = source.access_token_encrypted as string;
  const expiresAt = new Date(source.token_expires_at as string);
  if (expiresAt.getTime() - Date.now() < 60_000) {
    try {
      const refreshed = await refreshAccessToken(
        source.refresh_token_encrypted as string
      );
      accessToken = refreshed.access_token;
      await admin
        .from("import_sources")
        .update({
          access_token_encrypted: refreshed.access_token,
          token_expires_at: new Date(
            Date.now() + refreshed.expires_in * 1000
          ).toISOString(),
        })
        .eq("id", source.id);
    } catch {
      return apiError("Failed to refresh Google token. Please reconnect.", 401);
    }
  }

  // Optional: resume from a specific page token
  const body = await request.json().catch(() => ({}));
  const pageToken: string | undefined = body.pageToken;

  // Create or get import job
  let jobId: string;
  if (pageToken && body.jobId) {
    jobId = body.jobId;
  } else {
    const { data: job, error: jobErr } = await admin
      .from("import_jobs")
      .insert({
        user_id: user.id,
        source_id: source.id,
        status: "running",
        started_at: new Date().toISOString(),
        processed_items: 0,
        failed_items: 0,
        bytes_imported: 0,
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      return apiError("Failed to create import job", 500);
    }
    jobId = job.id;
  }

  try {
    const result = await listMediaItems(accessToken, pageToken);
    const items = result.mediaItems || [];

    let processed = 0;
    let failed = 0;
    let bytesImported = 0;

    for (const item of items) {
      try {
        await importSingleItem(admin, user.id, accessToken, item);
        processed++;
        bytesImported += await estimateSize(item);
      } catch (err) {
        console.error(`Failed to import ${item.filename}:`, err);
        failed++;
      }

      // Update progress every 5 items
      if ((processed + failed) % 5 === 0) {
        await admin.rpc("increment_import_progress", {
          job_id: jobId,
          add_processed: processed,
          add_failed: failed,
          add_bytes: bytesImported,
        }).then(() => {
          processed = 0;
          failed = 0;
          bytesImported = 0;
        }).catch(() => {
          // Fall back to direct update
        });
      }
    }

    // Flush remaining progress
    if (processed > 0 || failed > 0) {
      await admin
        .from("import_jobs")
        .update({
          processed_items: admin.rpc ? undefined : 0, // handled below
        })
        .eq("id", jobId);
    }

    // Use SQL to atomically increment
    await admin.rpc("increment_import_progress", {
      job_id: jobId,
      add_processed: processed,
      add_failed: failed,
      add_bytes: bytesImported,
    }).catch(async () => {
      // Fallback: read current values and update
      const { data: current } = await admin
        .from("import_jobs")
        .select("processed_items, failed_items, bytes_imported")
        .eq("id", jobId)
        .single();
      if (current) {
        await admin
          .from("import_jobs")
          .update({
            processed_items: current.processed_items + processed,
            failed_items: current.failed_items + failed,
            bytes_imported: current.bytes_imported + bytesImported,
          })
          .eq("id", jobId);
      }
    });

    // If there are more pages, tell the client to continue
    if (result.nextPageToken) {
      return apiSuccess({
        status: "in_progress",
        jobId,
        nextPageToken: result.nextPageToken,
        pageProcessed: items.length,
      });
    }

    // All done — mark complete
    await admin
      .from("import_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await admin
      .from("import_sources")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", source.id);

    return apiSuccess({ status: "completed", jobId });
  } catch (err) {
    console.error("Import error:", err);

    await admin
      .from("import_jobs")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", jobId);

    return apiError("Import failed", 500);
  }
}

async function importSingleItem(
  admin: ReturnType<typeof getAdminClient>,
  userId: string,
  accessToken: string,
  item: GoogleMediaItem
) {
  const fileId = crypto.randomUUID();
  const storageKey = generateStorageKey(userId, fileId);

  // Download original quality (=d suffix)
  const downloadUrl = `${item.baseUrl}=d`;
  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());

  // Upload to R2
  await uploadBuffer(storageKey, buffer, item.mimeType);

  const meta = item.mediaMetadata;
  const creationTime = meta.creationTime
    ? new Date(meta.creationTime).toISOString()
    : null;
  const width = meta.width ? parseInt(meta.width, 10) : null;
  const height = meta.height ? parseInt(meta.height, 10) : null;

  // Insert file record
  await admin.from("files").insert({
    id: fileId,
    owner_id: userId,
    storage_key: storageKey,
    thumbnail_key: null,
    original_filename: item.filename,
    mime_type: item.mimeType,
    file_size: buffer.length,
    width,
    height,
    blur_hash: null,
    original_created_at: creationTime,
    effective_date: creationTime || new Date().toISOString(),
  });

  // Fire-and-forget thumbnail generation
  if (item.mimeType.startsWith("image/") && !item.mimeType.includes("gif")) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    fetch(`${appUrl}/api/upload/thumbnail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId, storage_key: storageKey }),
    }).catch(() => {});
  }
}

async function estimateSize(item: GoogleMediaItem): Promise<number> {
  // Rough estimate: width * height * 3 bytes (RGB) / 10 (compression)
  const w = parseInt(item.mediaMetadata.width, 10) || 1000;
  const h = parseInt(item.mediaMetadata.height, 10) || 1000;
  return Math.round((w * h * 3) / 10);
}
