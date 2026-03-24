"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type ImportModalProps = {
  open: boolean;
  onClose: () => void;
};

type GoogleStatus = {
  connected: boolean;
  job: {
    id: string;
    status: "pending" | "running" | "paused" | "completed" | "failed";
    totalItems: number | null;
    processedItems: number;
    failedItems: number;
    bytesImported: number;
    startedAt: string | null;
    completedAt: string | null;
    errorMessage: string | null;
  } | null;
};

const otherProviders = [
  {
    id: "icloud",
    name: "Apple iCloud",
    hint: "Export from iCloud.com and use Import ZIP instead",
    icon: (
      <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.2 9.8c-.1-2.2-1.9-4-4.1-4-1.4 0-2.6.7-3.4 1.7-.4-.2-.8-.3-1.3-.3-1.7 0-3 1.3-3 3v.3C4.6 10.9 3 12.7 3 14.8 3 17.1 4.9 19 7.2 19h10.2c2 0 3.6-1.6 3.6-3.6 0-1.8-1.3-3.3-3-3.5l.2-2.1z" />
      </svg>
    ),
  },
  {
    id: "dropbox",
    name: "Dropbox",
    hint: null,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0061FF">
        <path d="M7.5 3L2 6.5l5.5 3.5L2 13.5 7.5 17l5.5-3.5L18.5 17 24 13.5l-5.5-3.5L24 6.5 18.5 3 13 6.5 7.5 3zm0 2.4L11 7.7 7.5 10 4 7.7l3.5-2.3zm11 0L22 7.7 18.5 10 15 7.7l3.5-2.3zM7.5 12.4L11 14.7l-3.5 2.3L4 14.7l3.5-2.3zm11 0L22 14.7l-3.5 2.3-3.5-2.3 3.5-2.3z" />
      </svg>
    ),
  },
  {
    id: "onedrive",
    name: "OneDrive",
    hint: null,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M10 14l4-6c1.5-2.2 4.5-2.8 6.7-1.3.8.6 1.4 1.4 1.7 2.3h.1c1.7 0 3 1.3 3 3s-1.3 3-3 3H10z" fill="#0364B8" />
        <path d="M6.5 17H16l-6-9c-1.3-2-3.8-2.5-5.8-1.2C3.1 7.6 2.4 8.8 2.2 10.1 .4 10.4-.6 12.2.3 13.8c.5.9 1.4 1.6 2.5 1.7L6.5 17z" fill="#0078D4" />
      </svg>
    ),
  },
];

export function ImportModal({ open, onClose }: ImportModalProps) {
  const [comingSoonId, setComingSoonId] = useState<string | null>(null);
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [importingNextPage, setImportingNextPage] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageRef = useRef<{ jobId: string; nextPageToken: string } | null>(null);

  const fetchGoogleStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/import/google/status");
      if (res.ok) {
        const data: GoogleStatus = await res.json();
        setGoogleStatus(data);
        return data;
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  // Poll while importing
  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    fetchGoogleStatus();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, fetchGoogleStatus]);

  useEffect(() => {
    const isRunning = googleStatus?.job?.status === "running";
    if (isRunning && !pollRef.current) {
      pollRef.current = setInterval(fetchGoogleStatus, 3000);
    } else if (!isRunning && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [googleStatus?.job?.status, fetchGoogleStatus]);

  async function startGoogleImport() {
    setGoogleLoading(true);
    try {
      const res = await fetch("/api/import/google/start", { method: "POST" });
      if (!res.ok) throw new Error("Failed to start import");
      const data = await res.json();

      if (data.nextPageToken) {
        pageRef.current = { jobId: data.jobId, nextPageToken: data.nextPageToken };
        continueImport(data.jobId, data.nextPageToken);
      }

      fetchGoogleStatus();
    } catch (err) {
      console.error("Start import error:", err);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function continueImport(jobId: string, nextPageToken: string) {
    setImportingNextPage(true);
    try {
      const res = await fetch("/api/import/google/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, pageToken: nextPageToken }),
      });
      if (!res.ok) return;
      const data = await res.json();

      if (data.nextPageToken) {
        pageRef.current = { jobId: data.jobId, nextPageToken: data.nextPageToken };
        // Recursively continue with next page
        continueImport(data.jobId, data.nextPageToken);
      } else {
        pageRef.current = null;
        setImportingNextPage(false);
        fetchGoogleStatus();
      }
    } catch {
      setImportingNextPage(false);
    }
  }

  useEffect(() => {
    if (!open) {
      setComingSoonId(null);
      return;
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const isRunning = googleStatus?.job?.status === "running" || importingNextPage;
  const isCompleted = googleStatus?.job?.status === "completed";
  const isFailed = googleStatus?.job?.status === "failed";
  const isConnected = googleStatus?.connected ?? false;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in slide-in-from-bottom-4 duration-300">
        {/* Close */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1 text-neutral-300 hover:text-neutral-500 transition-colors rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-[22px] font-bold text-neutral-900">
            Import your photos
          </h2>
          <p className="text-[14px] text-neutral-500 mt-1">
            Bring everything from another service
          </p>
        </div>

        {/* Provider list */}
        <div className="border border-neutral-100 rounded-xl overflow-hidden divide-y divide-neutral-100">
          {/* Google Photos — live integration */}
          <div>
            <GooglePhotosRow
              connected={isConnected}
              isRunning={isRunning}
              isCompleted={isCompleted}
              isFailed={isFailed}
              job={googleStatus?.job ?? null}
              loading={googleLoading}
              onConnect={() => {
                window.location.href = "/api/import/google/connect";
              }}
              onStartImport={startGoogleImport}
            />
          </div>

          {/* Other providers — coming soon */}
          {otherProviders.map((provider) => (
            <div key={provider.id}>
              <button
                onClick={() => setComingSoonId(comingSoonId === provider.id ? null : provider.id)}
                className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-neutral-50 transition-colors"
              >
                <span className="shrink-0">{provider.icon}</span>
                <span className="flex-1 text-[15px] font-medium text-neutral-900">
                  {provider.name}
                </span>
                <svg
                  className="w-4 h-4 text-neutral-300 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {comingSoonId === provider.id && (
                <div className="px-4 pb-3 -mt-1">
                  <p className="text-[13px] text-neutral-400 bg-neutral-50 rounded-lg px-3 py-2">
                    {provider.hint
                      ? provider.hint
                      : `We\u2019re working on ${provider.name} import. We\u2019ll notify you when it\u2019s ready.`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer reassurance */}
        <p className="text-[13px] text-neutral-400 text-center mt-5">
          Your photos stay in their original quality.
          <br />
          We preserve all dates, locations &amp; albums.
        </p>
      </div>
    </div>
  );
}

function GooglePhotosRow({
  connected,
  isRunning,
  isCompleted,
  isFailed,
  job,
  loading,
  onConnect,
  onStartImport,
}: {
  connected: boolean;
  isRunning: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  job: GoogleStatus["job"];
  loading: boolean;
  onConnect: () => void;
  onStartImport: () => void;
}) {
  const googleIcon = (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M12 7.5c0-3.038-2.462-5.5-5.5-5.5S1 4.462 1 7.5H12V7.5z" fill="#EA4335" />
      <path d="M12 7.5h5.5c3.038 0 5.5 2.462 5.5 5.5H12V7.5z" fill="#4285F4" />
      <path d="M12 13h-5.5C3.462 13 1 15.462 1 18.5h11V13z" fill="#FBBC04" />
      <path d="M17.5 13H12v5.5c0 3.038 2.462 5.5 5.5 5.5V13z" fill="#34A853" />
    </svg>
  );

  // Importing state
  if (isRunning && job) {
    const percent =
      job.processedItems > 0
        ? Math.round((job.processedItems / Math.max(job.processedItems + 100, job.totalItems ?? job.processedItems + 100)) * 100)
        : 0;
    return (
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-3 mb-2.5">
          <span className="shrink-0">{googleIcon}</span>
          <span className="text-[15px] font-medium text-neutral-900">
            Google Photos
          </span>
        </div>
        <p className="text-[13px] text-neutral-600 mb-2">
          Importing {job.processedItems.toLocaleString()} photos…
        </p>
        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(percent, 2)}%` }}
          />
        </div>
        {job.failedItems > 0 && (
          <p className="text-[12px] text-amber-500 mt-1.5">
            {job.failedItems} failed
          </p>
        )}
      </div>
    );
  }

  // Completed
  if (isCompleted && job) {
    return (
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="shrink-0">{googleIcon}</span>
          <div className="flex-1">
            <span className="text-[15px] font-medium text-neutral-900">
              Google Photos
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[13px] text-green-600">
                {job.processedItems.toLocaleString()} photos imported
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Failed
  if (isFailed && job) {
    return (
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-3 mb-2">
          <span className="shrink-0">{googleIcon}</span>
          <span className="text-[15px] font-medium text-neutral-900">
            Google Photos
          </span>
        </div>
        <p className="text-[13px] text-red-500 mb-2">
          Import failed. {job.processedItems > 0 ? `${job.processedItems} photos were imported before the error.` : ""}
        </p>
        <button
          onClick={onStartImport}
          disabled={loading}
          className="text-[13px] text-blue-500 hover:text-blue-600 font-medium"
        >
          {loading ? "Starting…" : "Try again"}
        </button>
      </div>
    );
  }

  // Connected but not started
  if (connected) {
    return (
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-3 mb-2.5">
          <span className="shrink-0">{googleIcon}</span>
          <div className="flex-1">
            <span className="text-[15px] font-medium text-neutral-900">
              Google Photos
            </span>
            <p className="text-[12px] text-green-500 mt-0.5">Connected</p>
          </div>
        </div>
        <button
          onClick={onStartImport}
          disabled={loading}
          className="w-full py-2 text-[13px] font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Starting import…" : "Import all photos"}
        </button>
      </div>
    );
  }

  // Not connected
  return (
    <button
      onClick={onConnect}
      className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-neutral-50 transition-colors"
    >
      <span className="shrink-0">{googleIcon}</span>
      <div className="flex-1">
        <span className="text-[15px] font-medium text-neutral-900">
          Google Photos
        </span>
        <p className="text-[12px] text-neutral-400 mt-0.5">
          Connect your account
        </p>
      </div>
      <svg
        className="w-4 h-4 text-neutral-300 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  );
}
