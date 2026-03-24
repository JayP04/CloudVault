import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Singleton R2 client
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});
  }
  return r2Client;
}

const BUCKET = process.env.R2_BUCKET_NAME!;
const PRESIGN_EXPIRY = 900; // 15 minutes (tighter than v1's 1 hour)

// ─── Key Generation ─────────────────────────────────────────────────────────

export function generateStorageKey(userId: string, fileId: string): string {
  return `vault/${userId}/${fileId}/original`;
}

export function generateThumbnailKey(
  userId: string,
  fileId: string,
  size: "sm" | "md"
): string {
  return `vault/${userId}/${fileId}/thumb_${size}.webp`;
}

// ─── Presigned URLs ─────────────────────────────────────────────────────────

export async function getUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getR2Client(), command, { expiresIn: PRESIGN_EXPIRY });
}

export async function getDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(getR2Client(), command, { expiresIn: PRESIGN_EXPIRY });
}

/** Batch-generate download URLs. Returns a map of key → signed URL. */
export async function getBatchDownloadUrls(
  keys: string[]
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    keys.map(async (key) => [key, await getDownloadUrl(key)] as const)
  );
  return Object.fromEntries(entries);
}

// ─── Object Operations ──────────────────────────────────────────────────────

export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await getR2Client().send(command);
}

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await getR2Client().send(command);
}

export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  // R2 supports up to 1000 keys per batch delete
  const batches = [];
  for (let i = 0; i < keys.length; i += 1000) {
    batches.push(keys.slice(i, i + 1000));
  }

  for (const batch of batches) {
    const command = new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: batch.map((key) => ({ Key: key })) },
    });
    await getR2Client().send(command);
  }
}
