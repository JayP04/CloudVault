"use client";

import { useUpload } from "@/hooks/use-upload";

export function UploadProgress() {
  const {
    isUploading,
    totalFiles,
    completedFiles,
    currentFileName,
    failedFiles,
    dismiss,
  } = useUpload();

  if (!isUploading) return null;

  const done = completedFiles + failedFiles >= totalFiles && totalFiles > 0;
  const allSuccess = done && failedFiles === 0;
  const hasErrors = done && failedFiles > 0;
  const percent =
    totalFiles > 0 ? Math.round(((completedFiles + failedFiles) / totalFiles) * 100) : 0;

  return (
    <>
      {/* Desktop: bottom-right */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-40">
        <Toast
          totalFiles={totalFiles}
          completedFiles={completedFiles}
          failedFiles={failedFiles}
          currentFileName={currentFileName}
          percent={percent}
          done={done}
          allSuccess={allSuccess}
          hasErrors={hasErrors}
          onDismiss={dismiss}
        />
      </div>
      {/* Mobile: above bottom nav */}
      <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40">
        <Toast
          totalFiles={totalFiles}
          completedFiles={completedFiles}
          failedFiles={failedFiles}
          currentFileName={currentFileName}
          percent={percent}
          done={done}
          allSuccess={allSuccess}
          hasErrors={hasErrors}
          onDismiss={dismiss}
        />
      </div>
    </>
  );
}

function Toast({
  totalFiles,
  completedFiles,
  failedFiles,
  currentFileName,
  percent,
  done,
  allSuccess,
  hasErrors,
  onDismiss,
}: {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  currentFileName: string | null;
  percent: number;
  done: boolean;
  allSuccess: boolean;
  hasErrors: boolean;
  onDismiss: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 p-4 w-80 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="shrink-0 mt-0.5">
          {allSuccess ? (
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : hasErrors ? (
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-blue-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-neutral-900 leading-tight">
            {allSuccess
              ? `${completedFiles} file${completedFiles !== 1 ? "s" : ""} uploaded`
              : hasErrors
                ? `${completedFiles} uploaded, ${failedFiles} failed`
                : `Uploading ${completedFiles + 1} of ${totalFiles}`}
          </p>

          {/* Progress bar */}
          {!done && (
            <div className="mt-2 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}

          {/* Current filename */}
          {!done && currentFileName && (
            <p className="text-[12px] text-neutral-400 mt-1 truncate">
              {currentFileName}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="shrink-0 p-0.5 text-neutral-300 hover:text-neutral-500 transition-colors rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
