import { z } from "zod";

// ─── File magic number validation ───────────────────────────────────────────

const BLOCKED_MIME_TYPES = [
  "application/x-msdownload",
  "application/x-executable",
  "application/x-dosexec",
  "application/x-msi",
  "application/x-sh",
];

export function isAllowedMimeType(mime: string): boolean {
  return !BLOCKED_MIME_TYPES.includes(mime) && mime.length > 0;
}

// Keep for backward-compat with existing schemas that use z.enum
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/csv",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
] as const;

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB per file

// ─── Schemas ────────────────────────────────────────────────────────────────

export const uploadRequestSchema = z.object({
  filename: z
    .string()
    .min(1)
    .max(500)
    .refine((name) => !name.includes("..") && !name.includes("/"), {
      message: "Invalid filename",
    }),
  mime_type: z.enum(ALLOWED_MIME_TYPES),
  file_size: z.number().int().positive().max(MAX_FILE_SIZE),
  exif_date: z.string().datetime().nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  location_lat: z.number().min(-90).max(90).nullable(),
  location_lng: z.number().min(-180).max(180).nullable(),
});

export const uploadConfirmSchema = z.object({
  file_id: z.string().uuid(),
  storage_key: z.string().min(1),
  thumbnail_key: z.string().nullable(),
  blur_hash: z.string().max(100).nullable(),
  metadata: z.object({
    original_filename: z.string().min(1).max(500),
    mime_type: z.enum(ALLOWED_MIME_TYPES),
    file_size: z.number().int().positive().max(MAX_FILE_SIZE),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
    original_created_at: z.string().datetime().nullable(),
    effective_date: z.string().datetime(),
    location_lat: z.number().min(-90).max(90).nullable(),
    location_lng: z.number().min(-180).max(180).nullable(),
  }),
});

export const batchUrlsSchema = z.object({
  file_ids: z.array(z.string().uuid()).min(1).max(100),
  size: z.enum(["sm", "md", "full"]).default("sm"),
});

export const createAlbumSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
});

export const cursorPaginationSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
