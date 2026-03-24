import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import { getDownloadUrl, uploadBuffer, generateThumbnailKey } from "@/lib/storage/r2";
import { getAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 30; // Allow up to 30s for large images

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const body = await request.json().catch(() => null);
  if (!body?.file_id || !body?.storage_key) {
    return apiError("Missing file_id or storage_key");
  }

  const { file_id, storage_key } = body;

  // Verify ownership
  if (!storage_key.startsWith(`vault/${user.id}/`)) {
    return apiError("Forbidden", 403);
  }

  try {
    // Dynamically import sharp (server-side only)
    const sharp = (await import("sharp")).default;

    // Get the original image URL and fetch it
    const originalUrl = await getDownloadUrl(storage_key);
    const response = await fetch(originalUrl);
    if (!response.ok) throw new Error("Failed to fetch original");

    const originalBuffer = Buffer.from(await response.arrayBuffer());

    // Get image metadata
    const metadata = await sharp(originalBuffer).metadata();
    const imgWidth = metadata.width || 0;
    const imgHeight = metadata.height || 0;

    // ── Generate small thumbnail (200px wide) ─────────────────────
    const smWidth = Math.min(200, imgWidth);
    const smBuffer = await sharp(originalBuffer)
      .resize(smWidth, null, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();

    const smKey = generateThumbnailKey(user.id, file_id, "sm");
    await uploadBuffer(smKey, smBuffer, "image/webp");

    // ── Generate medium thumbnail (800px wide) ────────────────────
    const mdWidth = Math.min(800, imgWidth);
    const mdBuffer = await sharp(originalBuffer)
      .resize(mdWidth, null, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const mdKey = generateThumbnailKey(user.id, file_id, "md");
    await uploadBuffer(mdKey, mdBuffer, "image/webp");

    // ── Generate blur hash placeholder ────────────────────────────
    // Create a tiny 32px version and extract raw pixel data
    const { data: rawPixels, info } = await sharp(originalBuffer)
      .resize(32, 32, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Dynamically import blurhash
    const { encode } = await import("blurhash");
    const blurHash = encode(
      new Uint8ClampedArray(rawPixels),
      info.width,
      info.height,
      4, // x components
      3  // y components
    );

    // ── Update file record with thumbnail info ────────────────────
    const admin = getAdminClient();
    await admin
      .from("files")
      .update({
        thumbnail_key: smKey,
        blur_hash: blurHash,
        width: imgWidth,
        height: imgHeight,
      })
      .eq("id", file_id);

    return apiSuccess({
      thumbnail_key: smKey,
      blur_hash: blurHash,
      width: imgWidth,
      height: imgHeight,
    });
  } catch (err) {
    console.error("Thumbnail generation error:", err);
    return apiError("Failed to generate thumbnails", 500);
  }
}
