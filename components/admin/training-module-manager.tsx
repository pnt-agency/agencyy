"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertTriangle, PlayCircle } from "lucide-react";
import { FileUpload, type UploadedFile } from "@/components/ui/file-upload";
import {
  presignVideoUploadAction,
  attachModuleVideoAction,
  setModulePublishedAction,
} from "@/app/upload-actions";
import { Badge } from "@/components/ui/badge";

export type AdminModule = {
  id: string;
  position: number;
  title: string;
  description: string;
  hasVideo: boolean;
  videoUrl: string | null;
  durationSeconds: number | null;
  published: boolean;
  questionCount: number;
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ModuleCard({ module }: { module: AdminModule }) {
  const [upload, setUpload] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  const handleUploaded = (file: UploadedFile | null) => {
    setUpload(file);
    setError(null);
    if (!file) return;
    startSave(async () => {
      const result = await attachModuleVideoAction(
        module.id,
        file.key,
        file.durationSeconds ?? 0
      );
      if (!result.success) setError(result.error);
    });
  };

  const togglePublished = () => {
    setError(null);
    startSave(async () => {
      const result = await setModulePublishedAction(module.id, !module.published);
      if (!result.success) setError(result.error);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-bold text-gold-deep">Module {module.position}</span>
            {module.published ? (
              <Badge variant="success">Published</Badge>
            ) : (
              <Badge variant="default">Draft</Badge>
            )}
          </div>
          <h2 className="text-lg font-bold text-ink">{module.title}</h2>
          <p className="text-sm text-gray-600 mt-1 max-w-prose">{module.description}</p>
          <p className="text-xs text-gray-400 mt-2">
            {module.questionCount} quiz question{module.questionCount === 1 ? "" : "s"}
            {module.hasVideo && ` · ${formatDuration(module.durationSeconds)}`}
          </p>
        </div>

        <button
          onClick={togglePublished}
          disabled={isSaving || (!module.hasVideo && !module.published)}
          title={
            !module.hasVideo && !module.published
              ? "Upload a video before publishing"
              : undefined
          }
          className="shrink-0 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {module.published ? "Unpublish" : "Publish"}
        </button>
      </div>

      {module.hasVideo && module.videoUrl ? (
        <div className="flex flex-col sm:flex-row gap-5">
          <video
            src={module.videoUrl}
            controls
            preload="metadata"
            className="w-full sm:w-64 aspect-video rounded-lg bg-black shrink-0"
          />
          <div className="flex-1">
            <FileUpload
              presign={presignVideoUploadAction}
              accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
              maxBytes={500 * 1024 * 1024}
              label="Replace video"
              hint="MP4, WebM or MOV, up to 500MB"
              measureDuration
              value={upload}
              onChange={handleUploaded}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm text-amber-900 mb-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            No video yet — members can&apos;t start this module.
          </p>
          <FileUpload
            presign={presignVideoUploadAction}
            accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
            maxBytes={500 * 1024 * 1024}
            label="Upload video"
            hint="MP4, WebM or MOV, up to 500MB"
            measureDuration
            value={upload}
            onChange={handleUploaded}
          />
        </div>
      )}

      {isSaving && <p className="text-xs text-gray-500 mt-3">Saving…</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600 mt-3">
          {error}
        </p>
      )}
    </div>
  );
}

export function TrainingModuleManager({
  modules,
  storageConfigured,
}: {
  modules: AdminModule[];
  storageConfigured: boolean;
}) {
  const publishedCount = modules.filter((m) => m.published).length;

  return (
    <div className="space-y-6">
      {!storageConfigured && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="flex items-center gap-2 text-sm text-red-900 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Video storage isn&apos;t configured.
          </p>
          <p className="text-sm text-red-800 mt-1">
            Set <code className="text-xs">R2_PUBLIC_BUCKET</code> and{" "}
            <code className="text-xs">R2_PUBLIC_BASE_URL</code> (plus the R2 credentials) before
            uploading. Until then, uploads here will fail.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-600">
        {publishedCount === modules.length ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <PlayCircle className="w-4 h-4 text-gray-400" />
        )}
        {publishedCount} of {modules.length} modules published and visible to members.
      </div>

      {modules.map((module) => (
        <ModuleCard key={module.id} module={module} />
      ))}
    </div>
  );
}
