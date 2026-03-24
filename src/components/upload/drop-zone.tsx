"use client";

import { useState, useCallback, useEffect, type ReactNode, type DragEvent } from "react";
import { useUpload } from "@/hooks/use-upload";

async function readAllEntries(dirReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  const all: FileSystemEntry[] = [];
  let batch: FileSystemEntry[];
  do {
    batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
      dirReader.readEntries(resolve, reject)
    );
    all.push(...batch);
  } while (batch.length > 0);
  return all;
}

async function getFilesFromEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      (entry as FileSystemFileEntry).file(resolve, reject)
    );
    return [file];
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const entries = await readAllEntries(reader);
    const nested = await Promise.all(entries.map(getFilesFromEntry));
    return nested.flat();
  }
  return [];
}

export function DropZone({ children }: { children: ReactNode }) {
  const { upload } = useUpload();
  const [dragCount, setDragCount] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const isActive = dragCount > 0;

  // Reset if user drags out of window entirely
  useEffect(() => {
    function handleDragLeaveWindow(e: globalThis.DragEvent) {
      if (
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        setDragCount(0);
        setFileCount(0);
      }
    }
    window.addEventListener("dragleave", handleDragLeaveWindow);
    return () => window.removeEventListener("dragleave", handleDragLeaveWindow);
  }, []);

  const onDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes("Files")) return;
    setDragCount((c) => c + 1);
    setFileCount(e.dataTransfer.items.length);
  }, []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes("Files")) return;
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragCount((c) => Math.max(0, c - 1));
  }, []);

  const onDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      setDragCount(0);
      setFileCount(0);

      const items = e.dataTransfer.items;
      const files: File[] = [];

      // Try webkitGetAsEntry for folder support
      const entries: FileSystemEntry[] = [];
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry?.();
          if (entry) entries.push(entry);
        }
      }

      if (entries.length > 0) {
        const nested = await Promise.all(entries.map(getFilesFromEntry));
        files.push(...nested.flat());
      } else {
        // Fallback: plain file list
        const fileList = e.dataTransfer.files;
        for (let i = 0; i < fileList.length; i++) {
          files.push(fileList[i]);
        }
      }

      if (files.length > 0) upload(files);
    },
    [upload]
  );

  return (
    <div
      className="relative w-full h-full"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] flex items-center justify-center transition-all duration-200 ${
          isActive
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } bg-black/40 backdrop-blur-sm`}
        aria-hidden={!isActive}
      >
        <div
          className={`bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center w-[280px] h-[200px] transition-transform duration-200 ${
            isActive ? "scale-100" : "scale-95"
          }`}
        >
          {/* Arrow icon */}
          <svg
            className="w-12 h-12 text-blue-500 mb-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m0-15l-4.5 4.5M12 4.5l4.5 4.5"
            />
          </svg>
          <p className="text-[17px] font-semibold text-neutral-900">
            Drop to upload
          </p>
          {fileCount > 0 && (
            <p className="text-[13px] text-neutral-400 mt-1">
              {fileCount} {fileCount === 1 ? "file" : "files"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
