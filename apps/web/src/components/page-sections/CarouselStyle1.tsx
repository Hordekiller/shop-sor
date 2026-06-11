"use client";

import { useRef } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";

interface Block {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  videoUrl: string;
  link: string;
  badge: string;
  badgeColor: string;
}

interface Props {
  title?: string;
  subtitle?: string;
  blocks: Block[];
}

export default function CarouselStyle1({ title, subtitle, blocks }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  if (!blocks || blocks.length === 0) return null;

  return (
    <section className="my-6">
      <div className="max-w-7xl mx-auto px-4">
        {(title || subtitle) && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--v-text)" }}
              >
                {title}
              </h2>
              {subtitle && (
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => scroll("right")}
                className="w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-gray-100"
                style={{ border: "1px solid var(--v-border)" }}
              >
                <Icon icon="tabler:chevron-right" className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll("left")}
                className="w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-gray-100"
                style={{ border: "1px solid var(--v-border)" }}
              >
                <Icon icon="tabler:chevron-left" className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
        >
          {blocks.map((block) => (
            <Link
              key={block.id}
              href={block.link || "#"}
              className="group snap-start shrink-0 w-44 rounded-xl overflow-hidden transition-all hover:shadow-lg"
              style={{
                background: "#fff",
                border: "1px solid var(--v-border)",
              }}
            >
              <div
                className="relative aspect-square overflow-hidden"
                style={{ background: "#f8f7fa" }}
              >
                {block.image ? (
                  <img
                    src={block.image}
                    alt={block.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : block.videoUrl ? (
                  <div className="w-full h-full flex items-center justify-center relative">
                    <img
                      src={block.videoUrl}
                      alt={block.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Icon
                          icon="tabler:player-play-filled"
                          className="w-6 h-6"
                          style={{ color: "var(--dk-primary)" }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon
                      icon="tabler:photo-off"
                      className="w-8 h-8"
                      style={{ color: "var(--v-text-disabled)" }}
                    />
                  </div>
                )}
                {block.badge && (
                  <span
                    className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-md shadow-sm"
                    style={{
                      background: block.badgeColor || "#ef4056",
                      color: "#fff",
                    }}
                  >
                    {block.badge}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p
                  className="text-sm font-medium line-clamp-2"
                  style={{ color: "var(--v-text)" }}
                >
                  {block.title}
                </p>
                {block.subtitle && (
                  <p
                    className="text-xs mt-1 line-clamp-1"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    {block.subtitle}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
