import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listTrainingModules } from "@/lib/db/queries";
import { isVideoStorageConfigured, videoUrl } from "@/lib/r2";
import {
  TrainingModuleManager,
  type AdminModule,
} from "@/components/admin/training-module-manager";

const navLink = "text-sm font-semibold text-gray-600 hover:text-black";

export default async function AdminTrainingPage() {
  const session = await getAdminSession();
  if (!session) redirect("/");

  // Admins see every module, published or not — that's the point of a draft.
  const modules = await listTrainingModules(false);
  const storageConfigured = isVideoStorageConfigured();

  const view: AdminModule[] = modules.map((module) => ({
    id: module.id,
    position: module.position,
    title: module.title,
    description: module.description,
    hasVideo: Boolean(module.videoKey),
    // Resolved server-side: videoUrl() throws when the public base URL is
    // unset, and a half-configured deploy shouldn't crash the page.
    videoUrl:
      module.videoKey && storageConfigured ? videoUrl(module.videoKey) : null,
    durationSeconds: module.videoDurationSeconds,
    published: module.published,
    questionCount: module.questions.length,
  }));

  return (
    <div className="flex-1 bg-gray-50 px-4 pt-28 pb-8 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-ink">Training Modules</h1>
            <p className="text-gray-600">
              Upload a video for each module, then publish it to make it visible to talent.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/admin" className={navLink}>← Pipeline</Link>
            <Link href="/admin/directory" className={navLink}>Directory</Link>
            <Link href="/admin/users" className={navLink}>Users</Link>
            <Link href="/admin/audit" className={navLink}>Audit Log →</Link>
          </div>
        </div>

        {view.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No training modules exist yet.
          </div>
        ) : (
          <TrainingModuleManager modules={view} storageConfigured={storageConfigured} />
        )}
      </div>
    </div>
  );
}
