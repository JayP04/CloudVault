"use client";

import { useState, useCallback } from "react";
import { useUpload } from "./use-upload";

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heic",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
};

function guessMime(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return MIME_MAP[ext] || "application/octet-stream";
}

type ZipState = {
  isExtracting: boolean;
  extractionProgress: string | null;
};

export function useZipUpload() {
  const { upload } = useUpload();
  const [state, setState] = useState<ZipState>({
    isExtracting: false,
    extractionProgress: null,
  });

  const uploadZip = useCallback(
    async (zipFile: File) => {
      setState({ isExtracting: true, extractionProgress: "Reading ZIP…" });

      try {
        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(zipFile);

        const files: File[] = [];
        const entries = Object.values(zip.files).filter(
          (entry) =>
            !entry.dir &&
            !entry.name.startsWith("__MACOSX") &&
            !entry.name.split("/").some((part) => part.startsWith("."))
        );

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const name = entry.name.split("/").pop() || entry.name;
          setState({
            isExtracting: true,
            extractionProgress: `Extracting ${i + 1} of ${entries.length}…`,
          });
          const blob = await entry.async("blob");
          files.push(new File([blob], name, { type: guessMime(name) }));
        }

        setState({ isExtracting: false, extractionProgress: null });

        if (files.length > 0) {
          return upload(files);
        }
        return { success: 0, failed: 0 };
      } catch (err) {
        console.error("ZIP extraction failed:", err);
        setState({ isExtracting: false, extractionProgress: null });
        return { success: 0, failed: 0 };
      }
    },
    [upload]
  );

  return { ...state, uploadZip };
}
