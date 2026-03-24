"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { UploadRequestResponse } from "@/types";

type UploadState = {
  isUploading: boolean;
  progress: string | null;
  totalFiles: number;
  completedFiles: number;
  currentFileName: string | null;
  failedFiles: number;
};

type UploadResult = { success: number; failed: number };

export function useUpload() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: null,
    totalFiles: 0,
    completedFiles: 0,
    currentFileName: null,
    failedFiles: 0,
  });

  const upload = useCallback(
    async (files: File[]): Promise<UploadResult> => {
      if (files.length === 0) return { success: 0, failed: 0 };

      setState({
        isUploading: true,
        progress: `Preparing ${files.length} file${files.length > 1 ? "s" : ""}…`,
        totalFiles: files.length,
        completedFiles: 0,
        currentFileName: null,
        failedFiles: 0,
      });

      let success = 0;
      let failed = 0;
      const exifr = (await import("exifr")).default;

      for (const file of files) {
        try {
          let exifDate: string | null = null;
          let width: number | null = null;
          let height: number | null = null;
          let locationLat: number | null = null;
          let locationLng: number | null = null;

          if (file.type.startsWith("image/")) {
            try {
              const exif = await exifr.parse(file, {
                pick: ["DateTimeOriginal", "ImageWidth", "ImageHeight", "ExifImageWidth", "ExifImageHeight", "latitude", "longitude"],
              });
              if (exif?.DateTimeOriginal) exifDate = new Date(exif.DateTimeOriginal).toISOString();
              width = exif?.ExifImageWidth || exif?.ImageWidth || null;
              height = exif?.ExifImageHeight || exif?.ImageHeight || null;
              locationLat = exif?.latitude || null;
              locationLng = exif?.longitude || null;
            } catch { /* best-effort */ }

            if (!width || !height) {
              try {
                const dims = await getImageDimensions(file);
                width = dims.width;
                height = dims.height;
              } catch { /* non-critical */ }
            }
          }

          setState((s) => ({ ...s, progress: `Uploading ${file.name}…`, currentFileName: file.name }));

          // Get presigned URL
          const reqRes = await fetch("/api/upload/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name, mime_type: file.type, file_size: file.size, exif_date: exifDate, width, height, location_lat: locationLat, location_lng: locationLng }),
          });
          if (!reqRes.ok) throw new Error("Failed to get upload URL");
          const uploadData: UploadRequestResponse = await reqRes.json();

          // Upload to R2
          const uploadRes = await fetch(uploadData.upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
          if (!uploadRes.ok) throw new Error("Upload to R2 failed");

          // Confirm upload
          const confirmRes = await fetch("/api/upload/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_id: uploadData.file_id,
              storage_key: uploadData.storage_key,
              thumbnail_key: null,
              blur_hash: null,
              metadata: { original_filename: file.name, mime_type: file.type, file_size: file.size, width, height, original_created_at: exifDate, effective_date: exifDate || new Date().toISOString(), location_lat: locationLat, location_lng: locationLng },
            }),
          });
          if (!confirmRes.ok) throw new Error("Confirm failed");

          // Fire-and-forget: generate thumbnails server-side
          if (file.type.startsWith("image/") && !file.type.includes("gif")) {
            fetch("/api/upload/thumbnail", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ file_id: uploadData.file_id, storage_key: uploadData.storage_key }),
            }).catch(() => {});
          }

          success++;
          setState((s) => ({ ...s, completedFiles: s.completedFiles + 1 }));
        } catch (err) {
          console.error(`Upload failed for ${file.name}:`, err);
          failed++;
          setState((s) => ({ ...s, failedFiles: s.failedFiles + 1 }));
        }
      }

      setState((s) => ({ ...s, progress: `${success} uploaded${failed > 0 ? `, ${failed} failed` : ""}`, currentFileName: null }));
      router.refresh();
      // Auto-dismiss after 3s on success, keep visible on errors
      if (failed === 0) {
        setTimeout(() => { setState({ isUploading: false, progress: null, totalFiles: 0, completedFiles: 0, currentFileName: null, failedFiles: 0 }); }, 3000);
      }
      return { success, failed };
    },
    [router]
  );

  const dismiss = useCallback(() => {
    setState({ isUploading: false, progress: null, totalFiles: 0, completedFiles: 0, currentFileName: null, failedFiles: 0 });
  }, []);

  return { ...state, upload, dismiss };
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(img.src); };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
