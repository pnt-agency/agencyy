import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listTrainingModules, listTrainingProgress } from "@/lib/db/queries";
import { isVideoStorageConfigured, videoUrl } from "@/lib/r2";
import { TrainingView, type TrainingModuleView } from "@/components/member/training-view";

export default async function TrainingPage() {
  const user = await getCurrentUser();
  if (!user?.id) {
    redirect("/");
  }

  const [modules, progress] = await Promise.all([
    listTrainingModules(true),
    listTrainingProgress(user.id),
  ]);
  const storageConfigured = isVideoStorageConfigured();

  // Modules unlock in sequence. Resolved here rather than in the client so the
  // gate the member sees matches the one recordTrainingProgressAction enforces.
  const completedIds = new Set(
    progress.filter((p) => p.completedAt).map((p) => p.moduleId)
  );

  const view: TrainingModuleView[] = modules.map((module, index) => {
    const own = progress.find((p) => p.moduleId === module.id);
    const completed = completedIds.has(module.id);
    // The first module is always open; every other one waits on its predecessor.
    const previous = index > 0 ? modules[index - 1] : null;
    const unlocked = !previous || completedIds.has(previous.id);

    return {
      id: module.id,
      position: module.position,
      title: module.title,
      description: module.description,
      // videoUrl() throws when the public base URL is unset; a half-configured
      // deploy should show "coming soon", not a 500.
      videoUrl: module.videoKey && storageConfigured ? videoUrl(module.videoKey) : null,
      durationSeconds: module.videoDurationSeconds,
      questions: module.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
      })),
      watched: Boolean(own?.watchedAt),
      completed,
      unlocked,
    };
  });

  return <TrainingView modules={view} />;
}
