"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FileRecord, BatchUrlsResponse } from "@/types";

type Props = {
  files: FileRecord[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
};

export function PhotoViewer({ files, initialIndex, isOpen, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [mdUrl, setMdUrl] = useState<string | null>(null);
  const [fullUrl, setFullUrl] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [mdLoaded, setMdLoaded] = useState(false);
  const touchStartX = useRef(0);

  const file = files[index];

  // Reset state when opening or index changes
  useEffect(() => {
    if (!isOpen) return;
    setIndex(initialIndex);
  }, [initialIndex, isOpen]);

  // Load URLs when file changes
  useEffect(() => {
    if (!isOpen || !file) return;
    setMdUrl(null);
    setFullUrl(null);
    setMdLoaded(false);

    // Fetch md size
    fetch("/api/files/batch-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_ids: [file.id], size: "md" }),
    })
      .then((r) => r.json())
      .then((data: BatchUrlsResponse) => {
        if (data.urls[file.id]) setMdUrl(data.urls[file.id]);
      })
      .catch(() => {});

    // Fetch full size
    fetch("/api/files/batch-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_ids: [file.id], size: "full" }),
    })
      .then((r) => r.json())
      .then((data: BatchUrlsResponse) => {
        if (data.urls[file.id]) setFullUrl(data.urls[file.id]);
      })
      .catch(() => {});
  }, [isOpen, index, file]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  const goTo = useCallback(
    (i: number) => {
      if (i >= 0 && i < files.length) setIndex(i);
    },
    [files.length]
  );

  // ── Actions ────────────────────────────────────────────────────────
  async function toggleFavorite() {
    if (!file) return;
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: !file.is_favorite }),
    });
  }

  async function handleDelete() {
    if (!file) return;
    await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    if (files.length <= 1) {
      onClose();
    } else {
      goTo(Math.min(index, files.length - 2));
    }
  }

  function handleDownload() {
    const url = fullUrl || mdUrl;
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = file.original_filename;
      a.click();
    }
  }

  // ── Touch handlers ─────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) {
      if (dx > 0) goTo(index - 1);
      else goTo(index + 1);
    }
  }

  if (!isOpen || !file) return null;

  const displayUrl = mdLoaded && fullUrl ? fullUrl : mdUrl;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 animate-fade-in select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Top action bar ─────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <span className="text-[13px] text-white/70">
          {index + 1} / {files.length}
        </span>
        <div className="flex items-center gap-3">
          {/* Favorite */}
          <button
            onClick={toggleFavorite}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <svg
              className={`w-5 h-5 ${file.is_favorite ? "text-red-500" : "text-white/80"}`}
              fill={file.is_favorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>

          {/* Info toggle */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${showInfo ? "bg-white/20" : "hover:bg-white/10"}`}
          >
            <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Nav arrows ─────────────────────────────────────────────── */}
      {index > 0 && (
        <button
          onClick={() => goTo(index - 1)}
          className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}
      {index < files.length - 1 && (
        <button
          onClick={() => goTo(index + 1)}
          className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* ── Image ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center w-full h-full p-4 lg:p-16">
        {displayUrl ? (
          <img
            key={file.id}
            src={displayUrl}
            alt={file.original_filename}
            className="max-w-full max-h-full object-contain"
            draggable={false}
            onLoad={() => {
              if (!mdLoaded) setMdLoaded(true);
            }}
          />
        ) : (
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        )}
      </div>

      {/* ── Info panel ─────────────────────────────────────────────── */}
      {showInfo && (
        <div className="absolute top-0 right-0 h-full w-72 bg-black/80 backdrop-blur-xl border-l border-white/10 p-6 pt-16 overflow-y-auto animate-fade-in">
          <h3 className="text-sm font-semibold text-white mb-4">Info</h3>
          <dl className="space-y-3 text-[13px]">
            <InfoRow label="Filename" value={file.original_filename} />
            <InfoRow label="Type" value={file.mime_type} />
            <InfoRow label="Date" value={new Date(file.effective_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })} />
            {file.width && file.height && (
              <InfoRow label="Dimensions" value={`${file.width} × ${file.height}`} />
            )}
            <InfoRow label="Size" value={formatBytes(file.file_size)} />
            {file.location_name && (
              <InfoRow label="Location" value={file.location_name} />
            )}
            {file.location_lat != null && file.location_lng != null && !file.location_name && (
              <InfoRow label="Coordinates" value={`${file.location_lat.toFixed(4)}, ${file.location_lng.toFixed(4)}`} />
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-500 text-[11px] uppercase tracking-wide">{label}</dt>
      <dd className="text-white mt-0.5 break-all">{value}</dd>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
