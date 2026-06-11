"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";

interface Story {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  videoUrl: string;
  link: string;
  bgColor: string;
  sortOrder: number;
  isActive: boolean;
}

export default function StoriesBar() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    fetch("/api/v1/stories")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.stories ?? []);
        const active = list
          .filter((s: Story) => s.isActive)
          .sort((a: Story, b: Story) => a.sortOrder - b.sortOrder);
        setStories(active);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  }, [stories.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  }, [stories.length]);

  const openViewer = useCallback((index: number) => {
    setCurrentIndex(index);
    setViewerOpen(true);
    setIsPaused(false);
    setProgress(0);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    setIsPaused(false);
    setProgress(0);
  }, []);

  // Auto-advance every 5s
  useEffect(() => {
    if (!viewerOpen || isPaused || stories.length === 0) return;
    const interval = setInterval(goNext, 5000);
    return () => clearInterval(interval);
  }, [viewerOpen, isPaused, goNext, stories.length]);

  // Visual progress bar
  useEffect(() => {
    if (!viewerOpen || isPaused) return;
    setProgress(0);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / 5000) * 100, 100);
      setProgress(pct);
      if (elapsed < 5000) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [viewerOpen, isPaused, currentIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!viewerOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewerOpen, closeViewer, goNext, goPrev]);

  if (loading) return null;
  if (stories.length === 0) return null;

  const current = stories[currentIndex];

  return (
    <section className="my-4">
      <div className="max-w-7xl mx-auto px-4">
        <div
          className="flex gap-4 overflow-x-auto scrollbar-hide py-2"
          dir="ltr"
        >
          {stories.map((story, i) => (
            <button
              key={story.id}
              onClick={() => openViewer(i)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] transition-transform group-hover:scale-105"
                style={{
                  background:
                    story.bgColor ||
                    "linear-gradient(135deg, #ef4056, #8b5cf6)",
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                  {story.image ? (
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Icon
                        icon="tabler:photo"
                        className="w-6 h-6 text-gray-400"
                      />
                    </div>
                  )}
                </div>
              </div>
              <span
                className="text-[11px] leading-tight text-center max-w-[72px] truncate"
                style={{ color: "var(--v-text-secondary)" }}
              >
                {story.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Full-screen story viewer modal */}
      {viewerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={closeViewer}
        >
          <div
            className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
            style={{ aspectRatio: "9/16", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress bars */}
            <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
              {stories.map((_, i) => (
                <div
                  key={i}
                  className="h-[3px] flex-1 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.3)" }}
                >
                  <div
                    className="h-full rounded-full transition-none"
                    style={{
                      width:
                        i < currentIndex
                          ? "100%"
                          : i === currentIndex
                            ? `${progress}%`
                            : "0%",
                      background: "rgba(255,255,255,0.9)",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Top controls */}
            <div className="absolute top-3 left-3 right-3 z-20 flex justify-between">
              <button
                onClick={closeViewer}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}
                aria-label="بستن"
              >
                <Icon icon="tabler:x" className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused((p) => !p);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}
                aria-label={isPaused ? "ادامه" : "توقف"}
              >
                <Icon
                  icon={
                    isPaused
                      ? "tabler:player-play-filled"
                      : "tabler:player-pause-filled"
                  }
                  className="w-4 h-4 text-white"
                />
              </button>
            </div>

            {/* Tap zones for prev/next */}
            <div className="absolute inset-0 z-10 flex">
              <div
                className="w-1/3 h-full"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
              />
              <div className="w-1/3 h-full" />
              <div
                className="w-1/3 h-full"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
              />
            </div>

            {/* Media */}
            <div className="absolute inset-0">
              {current.videoUrl ? (
                <video
                  src={current.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : current.image ? (
                <img
                  src={current.image}
                  alt={current.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: current.bgColor || "#1f2937" }}
                >
                  <Icon
                    icon="tabler:photo-off"
                    className="w-16 h-16 text-white/50"
                  />
                </div>
              )}
            </div>

            {/* Bottom info */}
            <div
              className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-8"
              style={{
                background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
              }}
            >
              <h3 className="text-white font-bold text-lg">{current.title}</h3>
              {current.subtitle && (
                <p className="text-white/80 text-sm mt-1">{current.subtitle}</p>
              )}
              {current.link && (
                <a
                  href={current.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--dk-primary, #8b5cf6)" }}
                >
                  مشاهده
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
