"use client";

import { DropZone } from "@/components/upload/drop-zone";
import { UploadProgress } from "@/components/upload/upload-progress";

export function MainShell({ children }: { children: React.ReactNode }) {
  return (
    <DropZone>
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
        {children}
      </div>
      <UploadProgress />
    </DropZone>
  );
}
