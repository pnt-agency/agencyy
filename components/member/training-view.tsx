"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, CheckCircle2, Lock, Clock } from "lucide-react";
import { recordTrainingProgressAction } from "@/app/upload-actions";

export type TrainingModuleView = {
  id: string;
  position: number;
  title: string;
  description: string;
  videoUrl: string | null;
  durationSeconds: number | null;
  questions: { id: string; prompt: string; options: string[] }[];
  watched: boolean;
  completed: boolean;
  /** False while an earlier module is still outstanding. */
  unlocked: boolean;
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ModuleCard({ module }: { module: TrainingModuleView }) {
  // Seeded from the server, then advanced locally so the UI responds the moment
  // the video ends rather than after a round trip. The server is still the
  // record of truth — these are only the optimistic half.
  const [watched, setWatched] = useState(module.watched);
  const [completed, setCompleted] = useState(module.completed);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  const handleEnded = () => {
    if (watched) return;
    setWatched(true);
    startSave(async () => {
      const result = await recordTrainingProgressAction(module.id, "watched");
      if (!result.success) {
        setWatched(false);
        setError(result.error);
      }
    });
  };

  const handleSubmitQuiz = () => {
    setError(null);
    // Matching the previous behaviour: the quiz checks that every question was
    // answered, it does not grade them. Grading would need correct answers,
    // which the original hardcoded questions never carried.
    if (Object.keys(answers).length < module.questions.length) {
      setError("Please answer every question before submitting.");
      return;
    }
    startSave(async () => {
      const result = await recordTrainingProgressAction(module.id, "completed");
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCompleted(true);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-bold text-gold-deep">Module {module.position}</span>
            {completed && <Badge variant="success">Completed</Badge>}
            {!completed && module.unlocked && <Badge variant="ink">Available</Badge>}
            {!module.unlocked && <Badge variant="default">Locked</Badge>}
          </div>
          <h2 className="text-2xl font-bold text-ink mb-3">{module.title}</h2>
          <p className="text-gray-600 mb-6">{module.description}</p>

          <div className="flex items-center gap-4 text-sm font-medium text-gray-500 mb-6">
            <span className="flex items-center gap-1">
              <PlayCircle className="w-4 h-4" />
              {/* Measured once at upload and stored, rather than making every
                  viewer download the video just to read its length. */}
              {formatDuration(module.durationSeconds)}
            </span>
            <span>•</span>
            <span>
              {module.questions.length} Question{module.questions.length === 1 ? "" : "s"} Quiz
            </span>
          </div>

          {module.unlocked && !watched && (
            <Button disabled variant="outline">Watch video to unlock quiz</Button>
          )}
          {module.unlocked && watched && !completed && (
            <Button variant="outline" className="text-green-600 border-green-200 bg-green-50">
              Video completed
            </Button>
          )}
        </div>

        <div className="w-full md:w-72 aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center text-white shrink-0 relative overflow-hidden">
          {!module.unlocked ? (
            <>
              <Lock className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-sm font-medium opacity-50 text-center px-4">
                Complete the previous module
              </span>
            </>
          ) : module.videoUrl ? (
            <video
              src={module.videoUrl}
              controls
              preload="metadata"
              className="w-full h-full object-cover"
              onEnded={handleEnded}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            // Only reachable if a module were published without a video. The
            // publish action refuses that, but saying so beats a dead player —
            // which is exactly the failure this rewrite replaced.
            <>
              <Clock className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-sm font-medium opacity-50">Video coming soon</span>
            </>
          )}
        </div>
      </div>

      {module.unlocked && (
        <div className="bg-gray-50 p-6 md:p-8 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-ink">Module {module.position} Quiz</h3>
            {completed && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Passed
              </span>
            )}
          </div>

          <div className="space-y-4">
            {module.questions.map((question, index) => (
              <fieldset
                key={question.id}
                disabled={completed || !watched}
                className="p-4 bg-white rounded-lg border border-gray-200 disabled:opacity-60"
              >
                <legend className="sr-only">{question.prompt}</legend>
                <p className="font-medium text-gray-800 mb-3">
                  {index + 1}. {question.prompt}
                </p>
                <div className="space-y-2 text-sm">
                  {question.options.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [question.id]: option }))
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 mt-4">
              {error}
            </p>
          )}

          {!completed && (
            <Button onClick={handleSubmitQuiz} disabled={!watched || isSaving} className="w-full mt-4">
              {isSaving ? "Saving…" : "Submit Quiz"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function TrainingView({ modules }: { modules: TrainingModuleView[] }) {
  const completed = modules.filter((m) => m.completed).length;

  // Every module is unpublished until an admin uploads a video, so this is the
  // normal state on a fresh install — not an error.
  if (modules.length === 0) {
    return (
      <div className="flex-1 bg-gray-50 pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-ink mb-2">Training is being prepared</h1>
            <p className="text-gray-500">
              Our team is finishing the modules. They&apos;ll appear here as soon as they&apos;re
              ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 pt-32 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-black text-ink mb-2">Training Hub</h1>
          <p className="text-gray-600">
            Complete {modules.length} module{modules.length === 1 ? "" : "s"} and their quizzes to
            finish your verification training.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden max-w-xs">
              <div
                className="h-full bg-black rounded-full transition-all"
                style={{ width: `${(completed / modules.length) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-600">
              {completed} / {modules.length} complete
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </div>
    </div>
  );
}
