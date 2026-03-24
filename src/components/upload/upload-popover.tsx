"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUpload } from "@/hooks/use-upload";
import { useZipUpload } from "@/hooks/use-zip-upload";

type UploadPopoverProps = {
  open: boolean;
  onClose: () => void;
  onImportClick: () => void;
};

export function UploadPopover({ open, onClose, onImportClick }: UploadPopoverProps) {
  const { upload } = useUpload();
  const { uploadZip } = useZipUpload();
  const popoverRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      onClose();
      upload(Array.from(files));
    },
    [upload, onClose]
  );

  const handleZip = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      onClose();
      uploadZip(files[0]);
    },
    [uploadZip, onClose]
  );

  if (!open) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-0 right-0 mb-2 mx-1 bg-[#2c2c2e] rounded-xl shadow-xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-150 z-50"
    >
      {/* Hidden file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*,video/*"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        /* @ts-expect-error webkitdirectory is non-standard */
        webkitdirectory=""
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={zipInputRef}
        type="file"
        className="hidden"
        accept=".zip,application/zip,application/x-zip-compressed"
        onChange={(e) => handleZip(e.target.files)}
      />

      <div className="py-1">
        <PopoverRow
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          }
          label="Photos & Videos"
          onClick={() => photoInputRef.current?.click()}
        />
        <PopoverRow
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
          label="Files"
          onClick={() => fileInputRef.current?.click()}
        />
        <PopoverRow
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          }
          label="Folder"
          onClick={() => folderInputRef.current?.click()}
        />
      </div>

      <div className="border-t border-white/5">
        <div className="py-1">
          <PopoverRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            }
            label="Import ZIP"
            onClick={() => zipInputRef.current?.click()}
          />
          <PopoverRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            }
            label="Import from…"
            onClick={() => {
              onClose();
              onImportClick();
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PopoverRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-[13px] text-neutral-200 hover:bg-white/10 rounded-lg cursor-pointer transition-colors mx-auto"
      style={{ margin: "0 4px", width: "calc(100% - 8px)" }}
    >
      <span className="text-neutral-400 shrink-0">{icon}</span>
      {label}
    </button>
  );
}
