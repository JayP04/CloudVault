"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { FileRecord, BatchUrlsResponse } from "@/types";

type SortKey = "name" | "kind" | "size" | "date";
type SortDir = "asc" | "desc";

type Props = {
  files: FileRecord[];
};

export function FileList({ files: initialFiles }: Props) {
  const [files] = useState<FileRecord[]>(initialFiles);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const loadedRef = useRef<Set<string>>(new Set());
  const router = useRouter();

  // Load download URLs
  const loadUrls = useCallback(async (fileList: FileRecord[]) => {
    const ids = fileList.filter((f) => !loadedRef.current.has(f.id)).map((f) => f.id);
    if (ids.length === 0) return;
    ids.forEach((id) => loadedRef.current.add(id));

    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      try {
        const res = await fetch("/api/files/batch-urls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_ids: batch, size: "full" }),
        });
        if (res.ok) {
          const data: BatchUrlsResponse = await res.json();
          setUrls((prev) => ({ ...prev, ...data.urls }));
        }
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    loadUrls(initialFiles);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sort files
  const sorted = [...files].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "name": return dir * a.original_filename.localeCompare(b.original_filename);
      case "kind": return dir * getKindLabel(a.mime_type).localeCompare(getKindLabel(b.mime_type));
      case "size": return dir * (a.file_size - b.file_size);
      case "date": return dir * (new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime());
      default: return 0;
    }
  });

  // Group by time period
  const grouped = groupByPeriod(sorted);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "date" ? "desc" : "asc"); }
  }

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
    setSelectedIds(new Set());
    setSelectMode(false);
    router.refresh();
  }

  function handleRowClick(file: FileRecord) {
    if (selectMode) {
      toggleSelect(file.id);
      return;
    }
    // Download on click
    const url = urls[file.id];
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = file.original_filename;
      a.click();
    }
  }

  const SortHeader = ({ label, col }: { label: string; col: SortKey }) => (
    <th
      onClick={() => handleSort(col)}
      className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-3 py-2 cursor-pointer hover:text-neutral-600 transition-colors select-none"
    >
      {label}
      {sortKey === col && (
        <span className="ml-1 text-blue-400">{sortDir === "asc" ? "↑" : "↓"}</span>
      )}
    </th>
  );

  return (
    <div className="pb-20 lg:pb-0">
      {/* Action bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {selectMode && (
            <>
              <button onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }} className="text-[13px] font-medium text-blue-400">Cancel</button>
              <span className="text-[13px] text-neutral-500">{selectedIds.size} selected</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <button
              onClick={deleteSelected}
              disabled={selectedIds.size === 0}
              className="px-3 py-1 text-[12px] font-medium rounded-md text-red-500 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 transition-colors"
            >
              Delete
            </button>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              className="px-3 py-1 text-[13px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Select
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-neutral-100">
            <tr>
              {selectMode && <th className="w-8" />}
              <SortHeader label="Name" col="name" />
              <SortHeader label="Kind" col="kind" />
              <SortHeader label="Size" col="size" />
              <SortHeader label="Date" col="date" />
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ label, files: periodFiles }) => (
              <GroupSection key={label} label={label}>
                {periodFiles.map((file) => {
                  const selected = selectedIds.has(file.id);
                  const { icon, color } = getFileIcon(file.mime_type);
                  return (
                    <tr
                      key={file.id}
                      onClick={() => handleRowClick(file)}
                      className={`border-b border-neutral-50 cursor-pointer transition-colors ${
                        selected ? "bg-blue-50" : "hover:bg-neutral-50"
                      }`}
                    >
                      {selectMode && (
                        <td className="w-8 pl-3">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selected ? "bg-blue-500 border-blue-500" : "border-neutral-300"
                          }`}>
                            {selected && (
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                            {icon}
                          </div>
                          <span className="text-[13px] text-neutral-900 truncate max-w-[200px] sm:max-w-xs">
                            {file.original_filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[13px] text-neutral-500">{getKindLabel(file.mime_type)}</td>
                      <td className="px-3 py-2.5 text-[13px] text-neutral-500">{formatBytes(file.file_size)}</td>
                      <td className="px-3 py-2.5 text-[13px] text-neutral-500">
                        {new Date(file.effective_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </GroupSection>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function GroupSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <tr>
        <td colSpan={5} className="px-3 pt-4 pb-1">
          <span className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</span>
        </td>
      </tr>
      {children}
    </>
  );
}

function getKindLabel(mime: string): string {
  if (mime === "application/pdf") return "PDF";
  if (mime.includes("word") || mime.includes("document")) return "Document";
  if (mime.includes("sheet") || mime.includes("excel")) return "Spreadsheet";
  if (mime.startsWith("image/")) return "Image";
  if (mime.startsWith("video/")) return "Video";
  if (mime.startsWith("audio/")) return "Audio";
  if (mime.includes("zip")) return "Archive";
  if (mime.startsWith("text/")) return "Text";
  return "File";
}

function getFileIcon(mime: string): { icon: React.ReactNode; color: string } {
  const cls = "w-4 h-4";
  const doc = <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;

  if (mime === "application/pdf") return { icon: doc, color: "bg-red-100 text-red-600" };
  if (mime.includes("word") || mime.includes("document")) return { icon: doc, color: "bg-blue-100 text-blue-600" };
  if (mime.includes("sheet") || mime.includes("excel")) return { icon: doc, color: "bg-green-100 text-green-600" };
  if (mime.startsWith("image/")) {
    return {
      icon: <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>,
      color: "bg-purple-100 text-purple-600",
    };
  }
  if (mime.startsWith("video/")) {
    return {
      icon: <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>,
      color: "bg-orange-100 text-orange-600",
    };
  }
  if (mime.startsWith("audio/")) {
    return {
      icon: <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" /></svg>,
      color: "bg-pink-100 text-pink-600",
    };
  }
  if (mime.includes("zip")) {
    return { icon: doc, color: "bg-yellow-100 text-yellow-600" };
  }
  return { icon: doc, color: "bg-neutral-100 text-neutral-500" };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

type PeriodGroup = { label: string; files: FileRecord[] };

function groupByPeriod(files: FileRecord[]): PeriodGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const groups = new Map<string, FileRecord[]>();
  const order: string[] = [];

  for (const file of files) {
    const date = new Date(file.effective_date);
    let label: string;
    if (date >= today) label = "Today";
    else if (date >= yesterday) label = "Yesterday";
    else if (date >= thisMonthStart) label = "This Month";
    else label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (!groups.has(label)) {
      groups.set(label, []);
      order.push(label);
    }
    groups.get(label)!.push(file);
  }

  return order.map((label) => ({ label, files: groups.get(label)! }));
}
