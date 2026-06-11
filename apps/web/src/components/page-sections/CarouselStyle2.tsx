"use client";

import { useState, useRef, useEffect } from "react";
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
  settings?: string;
}

interface TabConfig {
  id: string;
  label: string;
}

export default function CarouselStyle2({ title, subtitle, blocks }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const tabs: TabConfig[] = [
    { id: "supplements", label: "مکمل‌های بانوان" },
    { id: "newest", label: "جدیدترین‌ها" },
    { id: "suggested", label: "پیشنهادی" },
    { id: "skincare", label: "مراقبت پوست" },
  ];

  useEffect(() => {
    if (tabsRef.current) {
      const activeEl = tabsRef.current.children[activeTab] as HTMLElement;
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    }
  }, [activeTab]);

  const handleTabChange = (idx: number) => {
    setIsTransitioning(true);
    setActiveTab(idx);
    setTimeout(() => setIsTransitioning(false), 300);
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
                {title || "امروز چی بخریم؟"}
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
          </div>
        )}

        {/* Tabs with sliding indicator */}
        <div
          className="relative mb-4 overflow-x-auto scrollbar-hide"
          style={{ borderBottom: "1px solid var(--v-divider)" }}
        >
          <div ref={tabsRef} className="flex gap-1 relative">
            <div
              className="absolute bottom-0 h-0.5 rounded-full transition-all duration-300 ease-in-out"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                background: "var(--dk-primary)",
              }}
            />
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(idx)}
                className="px-4 py-2 text-sm whitespace-nowrap transition-all duration-200 relative"
                style={{
                  color:
                    activeTab === idx
                      ? "var(--dk-primary)"
                      : "var(--v-text-secondary)",
                  fontWeight: activeTab === idx ? 600 : 400,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Carousel with fade transition */}
        <div
          ref={scrollRef}
          className={`flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory transition-opacity duration-300 ${isTransitioning ? "opacity-50" : "opacity-100"}`}
        >
          {blocks.map((block) => (
            <Link
              key={block.id}
              href={block.link || "#"}
              className="group snap-start shrink-0 w-40 rounded-xl overflow-hidden transition-all hover:shadow-lg"
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
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
                  className="text-xs font-medium line-clamp-2"
                  style={{ color: "var(--v-text)" }}
                >
                  {block.title}
                </p>
                {block.subtitle && (
                  <p
                    className="text-xs mt-1 font-bold"
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
