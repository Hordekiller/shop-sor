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

export default function CarouselStyle3({ title, subtitle, blocks }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!blocks || blocks.length === 0) return null;

  return (
    <section className="my-6">
      <div className="max-w-7xl mx-auto px-4">
        {(title || subtitle) && (
          <div className="mb-4">
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
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {blocks.map((block) => (
            <Link
              key={block.id}
              href={block.link || "#"}
              className="group rounded-xl overflow-hidden transition-all hover:shadow-md"
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
                    className="text-xs mt-1 line-clamp-1 font-bold"
                    style={{ color: "var(--dk-primary)" }}
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
