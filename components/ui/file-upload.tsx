"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadedFile = {
  key: string;
  filename: string;
  size: number;
  contentType: string;
  /** Only set for video uploads, read from the file before it's sent. */
  durationSeconds?: number;
};

type Presign = (
  contentType: string,
  contentLength: number
) => Promise<{ success: true; url: string; key: string } | { success: false; error: string }>;

type FileUploadProps = {
  /** Server action that authorizes the upload and returns a presigned PUT URL. */
  presign: Presign;
  /** `accept` for the file input, e.g. ".pdf,.docx". */
  accept: string;
  maxBytes: number;
  label: string;
  hint?: string;
  /** Reads duration off the file before upload — video only. */
  measureDuration?: boolean;
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  tone?: "light" | "dark";
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Reads a video's duration in the browser, before upload.
 *
 * Doing it here means the module list can show a runtime without every visitor
 * downloading every video to measure it — which is what the old player did, and
 * why the duration always read "Loading duration...".
 */
function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? video.duration : 0);
    };
    // A duration we can't read isn't worth failing an upload over.
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.src = url;
  });
}

/**
 * Uploads straight from the browser to R2 using a presigned URL.
 *
 * XMLHttpRequest rather than fetch() purely for `upload.onprogress` — fetch has
 * no upload progress event, and a 500MB video needs a progress bar. The bytes
 * never touch our server: a Vercel function body caps at 4.5MB.
 */
export function FileUpload({
  presign,
  accept,
  maxBytes,
  label,
  hint,
  measureDuration = false,
  value,
  onChange,
  tone = "light",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDark = tone === "dark";

  const handleFile = async (file: File) => {
    setError(null);

    if (file.size > maxBytes) {
      setError(`That file is too large. The limit is ${Math.floor(maxBytes / 1024 / 1024)}MB.`);
      return;
    }

    setProgress(0);
    try {
      const duration = measureDuration ? await readDuration(file) : undefined;

      // The server re-checks type and size and signs both into the URL, so R2
      // itself rejects anything that doesn't match.
      const signed = await presign(file.type, file.size);
      if (!signed.success) {
        setError(signed.error);
        setProgress(null);
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signed.url);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Upload failed (${xhr.status})`));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      onChange({
        key: signed.key,
        filename: file.name,
        size: file.size,
        contentType: file.type,
        durationSeconds: duration,
      });
      setProgress(null);
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      setError("The upload didn't finish. Please check your connection and try again.");
      setProgress(null);
    }
  };

  const uploading = progress !== null;

  return (
    <div className="flex flex-col gap-2">
      <span className={cn("text-sm font-medium", isDark ? "text-white/80" : "text-black")}>
        {label}
      </span>

      {value ? (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3",
            isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
          )}
        >
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm font-medium truncate", isDark ? "text-white" : "text-black")}>
              {value.filename}
            </p>
            <p className={cn("text-xs", isDark ? "text-white/40" : "text-gray-500")}>
              {formatSize(value.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            aria-label={`Remove ${value.filename}`}
            className={cn(
              "p-1.5 rounded-lg shrink-0 transition-colors cursor-pointer",
              isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-black"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex items-center justify-center gap-2.5 rounded-xl border border-dashed px-4 py-5 text-sm transition-colors cursor-pointer disabled:cursor-wait",
            isDark
              ? "border-white/20 text-white/60 hover:border-gold/50 hover:text-white"
              : "border-gray-300 text-gray-500 hover:border-black hover:text-black"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading… {progress}%
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Choose a file
            </>
          )}
        </button>
      )}

      {uploading && (
        <div
          className={cn(
            "h-1.5 w-full rounded-full overflow-hidden",
            isDark ? "bg-white/10" : "bg-gray-100"
          )}
          role="progressbar"
          aria-valuenow={progress ?? 0}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-gold rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {hint && !error && (
        <p className={cn("text-xs flex items-center gap-1.5", isDark ? "text-white/40" : "text-gray-500")}>
          <FileText className="w-3.5 h-3.5" />
          {hint}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
