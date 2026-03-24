"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PhotoViewer } from "@/components/gallery/photo-viewer";
import type { FileRecord, BatchUrlsResponse } from "@/types";

type Props = {
  initialFiles: FileRecord[];
  initialCursor: string | null;
  showDaysLeft?: boolean;
  totalPhotos?: number;
  totalVideos?: number;
};

export function PhotoGrid({ initialFiles, initialCursor, showDaysLeft, totalPhotos, totalVideos }: Props) {
  const [files, setFiles] = useState<FileRecord[]>(initialFiles);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ── Batch load URLs ────────────────────────────────────────────────
  const loadedRef = useRef<Set<string>>(new Set());

  const loadUrls = useCallback(async (fileList: FileRecord[]) => {
    const idsToLoad = fileList.filter((f) => !loadedRef.current.has(f.id)).map((f) => f.id);
    if (idsToLoad.length === 0) return;

    idsToLoad.forEach((id) => loadedRef.current.add(id));

    for (let i = 0; i < idsToLoad.length; i += 50) {
      const batch = idsToLoad.slice(i, i + 50);
      try {
        const res = await fetch("/api/files/batch-urls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_ids: batch, size: "sm" }),
        });
        if (res.ok) {
          const data: BatchUrlsResponse = await res.json();
          setUrls((prev) => ({ ...prev, ...data.urls }));
        }
      } catch (err) {
        console.error("Failed to load URLs:", err);
      }
    }
  }, []);

  useEffect(() => {
    loadUrls(initialFiles);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Infinite scroll ────────────────────────────────────────────────
  useEffect(() => {
    if (!cursor || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore && cursor) {
          setLoadingMore(true);
          setTimeout(() => setLoadingMore(false), 500);
        }
      },
      { rootMargin: "600px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [cursor, loadingMore]);

  // ── Group by date ──────────────────────────────────────────────────
  const grouped = groupByDate(files);
  const flatFiles = grouped.flatMap((g) => g.files);
  let flatIdx = 0;

  // ── Count photos & videos for bottom label ─────────────────────────
  const photoCount = totalPhotos ?? files.filter((f) => f.mime_type.startsWith("image/")).length;
  const videoCount = totalVideos ?? files.filter((f) => f.mime_type.startsWith("video/")).length;

  // ── Actions ────────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    await Promise.all(
      Array.from(selectedIds).map((id) => fetch(`/api/files/${id}`, { method: "DELETE" }))
    );
    exitSelect();
    router.refresh();
  }

  async function favoriteSelected() {
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/files/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_favorite: true }),
        })
      )
    );
    exitSelect();
    router.refresh();
  }

  async function restoreSelected() {
    await Promise.all(
      Array.from(selectedIds).map((id) => fetch(`/api/files/${id}/restore`, { method: "POST" }))
    );
    exitSelect();
    router.refresh();
  }

  async function permanentDeleteSelected() {
    if (!confirm("Permanently delete? This cannot be undone.")) return;
    await Promise.all(
      Array.from(selectedIds).map((id) => fetch(`/api/files/${id}/permanent-delete`, { method: "DELETE" }))
    );
    exitSelect();
    router.refresh();
  }

  function exitSelect() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* ── iCloud-style top action bar ────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {selectMode && (
            <>
              <button onClick={exitSelect} className="text-[13px] font-medium text-[#0A84FF]">
                Cancel
              </button>
              <span className="text-[13px] text-[#98989d]">
                {selectedIds.size} selected
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {selectMode ? (
            <>
              {showDaysLeft ? (
                <>
                  <ActionBtn onClick={restoreSelected} disabled={selectedIds.size === 0} label="Restore" />
                  <ActionBtn onClick={permanentDeleteSelected} disabled={selectedIds.size === 0} label="Delete Forever" danger />
                </>
              ) : (
                <>
                  <ActionBtn onClick={favoriteSelected} disabled={selectedIds.size === 0} label="Favorite" />
                  <ActionBtn onClick={deleteSelected} disabled={selectedIds.size === 0} label="Delete" danger />
                </>
              )}
            </>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              className="px-3 py-1 text-[13px] font-medium text-[#0A84FF] hover:text-[#409CFF] transition-colors"
            >
              Select
            </button>
          )}
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────── */}
      <div className="space-y-8">
        {grouped.map(({ label, locationName, files: groupFiles }) => (
          <section key={label}>
            <div className="mb-3">
              <h2 className="text-[17px] font-bold text-white">{label}</h2>
              {locationName && (
                <p className="text-[12px] text-[#98989d] mt-0.5">{locationName}</p>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-[2px]">
              {groupFiles.map((file) => {
                const selected = selectedIds.has(file.id);
                const isVideo = file.mime_type.startsWith("video/");
                const daysLeft = showDaysLeft && file.deleted_at
                  ? Math.max(0, Math.ceil((new Date(file.deleted_at).getTime() + 30 * 86400000 - Date.now()) / 86400000))
                  : null;
                const currentFlatIdx = flatIdx++;

                return (
                  <div
                    key={file.id}
                    onClick={() => {
                      if (selectMode) {
                        toggleSelect(file.id);
                      } else {
                        setViewerIndex(currentFlatIdx);
                        setViewerOpen(true);
                      }
                    }}
                    className={`photo-cell relative aspect-square bg-[#2c2c2e] rounded-[3px] overflow-hidden cursor-pointer ${
                      selected ? "ring-2 ring-[#0A84FF] ring-inset opacity-75" : ""
                    }`}
                  >
                    {/* Image */}
                    {urls[file.id] ? (
                      <img
                        src={urls[file.id]}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full skeleton" />
                    )}

                    {/* Selection check */}
                    {selectMode && (
                      <div className="absolute top-1.5 right-1.5 z-10">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          selected ? "bg-[#0A84FF]" : "bg-black/40 border border-white/50"
                        }`}>
                          {selected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Favorite badge */}
                    {file.is_favorite && !selectMode && (
                      <div className="absolute bottom-1.5 left-1.5">
                        <svg className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                      </div>
                    )}

                    {/* Video duration */}
                    {isVideo && (
                      <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-semibold text-white tabular-nums">
                        <svg className="w-2.5 h-2.5 inline mr-0.5 -mt-px" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    )}

                    {/* Days left (trash) */}
                    {daysLeft !== null && !selectMode && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-4 pb-1 text-center">
                        <span className="text-[9px] font-medium text-white/90">
                          {daysLeft > 0 ? `${daysLeft}d left` : "Deletes today"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      {cursor && (
        <div ref={sentinelRef} className="h-16 flex items-center justify-center">
          {loadingMore && (
            <div className="w-5 h-5 border-2 border-white/10 border-t-[#0A84FF] rounded-full animate-spin" />
          )}
        </div>
      )}

      {/* ── Bottom stats (iCloud-style) ────────────────────────────── */}
      {(photoCount > 0 || videoCount > 0) && (
        <div className="text-center py-8">
          <p className="text-[13px] text-[#98989d]">
            {[
              photoCount > 0 && `${photoCount.toLocaleString()} Photo${photoCount !== 1 ? "s" : ""}`,
              videoCount > 0 && `${videoCount.toLocaleString()} Video${videoCount !== 1 ? "s" : ""}`,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      )}

      {/* Photo viewer lightbox */}
      <PhotoViewer
        files={flatFiles}
        initialIndex={viewerIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function ActionBtn({ onClick, disabled, label, danger }: { onClick: () => void; disabled: boolean; label: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 text-[12px] font-medium rounded-md disabled:opacity-30 transition-colors ${
        danger
          ? "text-[#FF453A] bg-[#FF453A]/10 hover:bg-[#FF453A]/20"
          : "text-[#0A84FF] bg-[#0A84FF]/10 hover:bg-[#0A84FF]/20"
      }`}
    >
      {label}
    </button>
  );
}

type DateGroup = { label: string; locationName: string | null; files: FileRecord[] };

function groupByDate(files: FileRecord[]): DateGroup[] {
  const groups = new Map<string, { files: FileRecord[]; locationName: string | null }>();

  for (const file of files) {
    const date = new Date(file.effective_date);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (!groups.has(key)) {
      groups.set(key, { files: [], locationName: file.location_name || null });
    }
    groups.get(key)!.files.push(file);
  }

  return Array.from(groups.entries()).map(([, { files, locationName }]) => ({
    label: formatDateRange(files),
    locationName,
    files,
  }));
}

function formatDateRange(files: FileRecord[]): string {
  if (files.length === 0) return "";
  const dates = files.map((f) => new Date(f.effective_date));
  const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
  const latest = new Date(Math.max(...dates.map((d) => d.getTime())));

  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (earliest.toDateString() === latest.toDateString()) return fmt(earliest);
  return `${fmt(earliest)} – ${fmt(latest)}`;
}
