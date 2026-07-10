"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, CheckCircle2, Lock } from "lucide-react";

const defaultModules = [
  {
    id: 1,
    title: "Integrity at Work",
    description: "Understanding how to do the right thing when no one is watching. Building trust through honesty.",
    status: "Available",
    questions: [
      { text: "Which of the following best describes integrity at work?", options: ["Doing the right thing when no one is watching", "Working as fast as possible", "Never making a mistake"] }
    ]
  },
  {
    id: 2,
    title: "Stewardship and Responsibility",
    description: "Treating your client's business as if it were your own. Taking ownership of tasks.",
    status: "Locked",
    questions: [
      { text: "What is the core principle of stewardship?", options: ["Taking ownership of your tasks", "Passing blame to others", "Working only required hours"] }
    ]
  },
  {
    id: 3,
    title: "Excellence and Timeliness",
    description: "Delivering outstanding results and respecting deadlines. The difference between good and great.",
    status: "Locked",
    questions: [
      { text: "How should you handle deadlines?", options: ["Respect them and communicate delays early", "Ignore them", "Deliver poor quality work to meet them"] }
    ]
  },
  {
    id: 4,
    title: "Honest Communication",
    description: "Proactive communication, setting expectations, and how to deliver bad news respectfully.",
    status: "Locked",
    questions: [
      { text: "When delivering bad news, you should:", options: ["Be proactive and respectful", "Hide it from the client", "Blame your coworkers"] }
    ]
  },
  {
    id: 5,
    title: "Client Relationship and Confidentiality",
    description: "Protecting client data, maintaining professional boundaries, and ensuring privacy.",
    status: "Locked",
    questions: [
      { text: "How should you treat client data?", options: ["With strict confidentiality", "Share it with friends", "Post it on social media"] }
    ]
  },
];

export function TrainingView() {
  const [modules, setModules] = useState(defaultModules);
  const [watchedVideos, setWatchedVideos] = useState<Record<number, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<number, Record<number, string>>>({});
  const [videoDurations, setVideoDurations] = useState<Record<number, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem("training-progress");
    const savedWatched = localStorage.getItem("training-watched");
    if (saved) {
      try {
        // One-time hydration from localStorage, only available after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setModules(JSON.parse(saved));
      } catch {}
    }
    if (savedWatched) {
      try {
        setWatchedVideos(JSON.parse(savedWatched));
      } catch {}
    }
  }, []);

  const saveState = (newModules: typeof defaultModules, newWatched: Record<number, boolean>) => {
    setModules(newModules);
    setWatchedVideos(newWatched);
    localStorage.setItem("training-progress", JSON.stringify(newModules));
    localStorage.setItem("training-watched", JSON.stringify(newWatched));
  };

  const handleLoadedMetadata = (id: number, e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const durationInSeconds = (e.target as HTMLVideoElement).duration;
    if (isNaN(durationInSeconds)) return;
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    setVideoDurations((prev) => ({
      ...prev,
      [id]: `${minutes}:${seconds.toString().padStart(2, "0")} mins`
    }));
  };

  const handleVideoEnded = (id: number) => {
    const newWatched = { ...watchedVideos, [id]: true };
    saveState(modules, newWatched);
  };

  const handleQuizChange = (modId: number, qIndex: number, answer: string) => {
    setQuizAnswers({
      ...quizAnswers,
      [modId]: {
        ...(quizAnswers[modId] || {}),
        [qIndex]: answer
      }
    });
  };

  const handleSubmitQuiz = (id: number) => {
    if (!watchedVideos[id]) {
      alert("Please finish watching the video first before submitting the quiz.");
      return;
    }

    const currentModule = modules.find(m => m.id === id);
    if (!currentModule) return;

    const answeredCount = Object.keys(quizAnswers[id] || {}).length;
    if (answeredCount < currentModule.questions.length) {
      alert("Please answer all questions for the quiz.");
      return;
    }

    const newModules = modules.map((m) => {
      if (m.id === id) return { ...m, status: "Completed" };
      if (m.id === id + 1 && m.status === "Locked") return { ...m, status: "Available" };
      return m;
    });
    saveState(newModules, watchedVideos);
  };

  return (
    <div className="flex-1 bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-navy mb-4">Talent Verification Training</h1>
          <p className="text-gray-600">
            Complete these 5 modules and the associated quizzes to earn your Verified Badge.
          </p>
        </div>

        <div className="space-y-6">
          {modules.map((mod) => (
            <div key={mod.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold text-gold">Module {mod.id}</span>
                    {mod.status === "Completed" && <Badge variant="success">Completed</Badge>}
                    {mod.status === "Available" && <Badge variant="navy">Available</Badge>}
                    {mod.status === "Locked" && <Badge variant="default">Locked</Badge>}
                  </div>
                  <h2 className="text-2xl font-bold text-navy mb-3">{mod.title}</h2>
                  <p className="text-gray-600 mb-6">{mod.description}</p>

                  <div className="flex items-center gap-4 text-sm font-medium text-gray-500 mb-6">
                    <span className="flex items-center gap-1">
                      <PlayCircle className="w-4 h-4" />
                      {videoDurations[mod.id] ? videoDurations[mod.id] : "Loading duration..."}
                    </span>
                    <span>•</span>
                    <span>{mod.questions.length} Question{mod.questions.length > 1 ? "s" : ""} Quiz</span>
                  </div>

                  {mod.status === "Available" && !watchedVideos[mod.id] && (
                    <Button disabled variant="outline">Watch video to unlock quiz</Button>
                  )}
                  {mod.status === "Available" && watchedVideos[mod.id] && (
                    <Button variant="outline" className="text-green-600 border-green-200 bg-green-50">Video Completed</Button>
                  )}
                </div>

                {/* Video Player */}
                <div className="w-full md:w-72 aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center text-white shrink-0 relative overflow-hidden">
                  {mod.status === "Locked" ? (
                    <>
                      <Lock className="w-10 h-10 mb-2 opacity-50" />
                      <span className="text-sm font-medium opacity-50">Complete previous module</span>
                    </>
                  ) : (
                    <video
                      src={`/videos/module${mod.id}.mp4`}
                      controls
                      className="w-full h-full object-cover"
                      onLoadedMetadata={(e) => handleLoadedMetadata(mod.id, e)}
                      onEnded={() => handleVideoEnded(mod.id)}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </div>

              {/* Quiz Section - only show if available or completed */}
              {(mod.status === "Available" || mod.status === "Completed") && (
                <div className="bg-gray-50 p-6 md:p-8 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-navy">Module {mod.id} Quiz</h3>
                    {mod.status === "Completed" && <span className="text-green-600 font-bold text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Passed</span>}
                  </div>

                  <div className="space-y-4">
                    {mod.questions.map((q, index) => (
                      <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
                        <p className="font-medium text-gray-800 mb-3">{index + 1}. {q.text}</p>
                        <div className="space-y-2 text-sm">
                          {q.options.map((opt, optIndex) => (
                            <label key={optIndex} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="radio"
                                name={`q${index}-${mod.id}`}
                                value={opt}
                                disabled={mod.status === "Completed"}
                                onChange={(e) => handleQuizChange(mod.id, index, e.target.value)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    {mod.status === "Available" && (
                      <Button onClick={() => handleSubmitQuiz(mod.id)} className="w-full mt-4">
                        Submit Quiz
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
