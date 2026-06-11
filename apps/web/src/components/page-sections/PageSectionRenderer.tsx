"use client";

import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import Link from "next/link";

const CarouselStyle1 = dynamic(() => import("./CarouselStyle1"), {
  ssr: false,
});
const CarouselStyle2 = dynamic(() => import("./CarouselStyle2"), {
  ssr: false,
});
const CarouselStyle3 = dynamic(() => import("./CarouselStyle3"), {
  ssr: false,
});

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

interface Section {
  id: number;
  type: string;
  title: string;
  subtitle: string;
  settings: string;
  isActive: boolean;
  blocks: Block[];
  sortOrder: number;
}

interface Props {
  sections: Section[];
}

function BannerRenderer({ section }: { section: Section }) {
  const blocks = section.blocks || [];
  if (blocks.length === 0) return null;
  const block = blocks[0];
  return (
    <section className="my-6">
      <div className="max-w-7xl mx-auto px-4">
        <Link
          href={block.link || "#"}
          className="block rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          {block.image ? (
            <img
              src={block.image}
              alt={block.title || ""}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-48 flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
              }}
            >
              <div className="text-center text-white">
                <p className="text-xl font-bold">
                  {block.title || section.title}
                </p>
                {block.subtitle && (
                  <p className="text-sm mt-1 opacity-80">{block.subtitle}</p>
                )}
              </div>
            </div>
          )}
        </Link>
      </div>
    </section>
  );
}

function FeaturedProductsRenderer({ section }: { section: Section }) {
  const blocks = section.blocks || [];
  if (blocks.length === 0) return null;
  return (
    <section className="my-6">
      <div className="max-w-7xl mx-auto px-4">
        {(section.title || section.subtitle) && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--v-text)" }}
              >
                {section.title || "محصولات ویژه"}
              </h2>
              {section.subtitle && (
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  {section.subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {blocks.map((block) => (
            <Link
              key={block.id}
              href={block.link || "#"}
              className="group rounded-xl overflow-hidden transition-all hover:shadow-lg"
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

function StoryRenderer({ section }: { section: Section }) {
  const blocks = section.blocks || [];
  if (blocks.length === 0) return null;
  return (
    <section className="my-6">
      <div className="max-w-7xl mx-auto px-4">
        {(section.title || section.subtitle) && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--v-text)" }}
              >
                {section.title || "استوری‌ها"}
              </h2>
              {section.subtitle && (
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  {section.subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {blocks.map((block) => (
            <Link
              key={block.id}
              href={block.link || "#"}
              className="flex flex-col items-center gap-1 shrink-0 group"
            >
              <div
                className="w-16 h-16 rounded-full p-0.5"
                style={{
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  {block.image ? (
                    <img
                      src={block.image}
                      alt={block.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon
                        icon="tabler:photo"
                        className="w-6 h-6"
                        style={{ color: "var(--v-text-secondary)" }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <span
                className="text-xs text-center line-clamp-1 w-16"
                style={{ color: "var(--v-text-secondary)" }}
              >
                {block.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HtmlRenderer({ section }: { section: Section }) {
  const block = (section.blocks || [])[0];
  if (!block) return null;
  return (
    <section className="my-6">
      <div className="max-w-7xl mx-auto px-4">
        {block.title && (
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: "var(--v-text)" }}
          >
            {block.title}
          </h2>
        )}
        <div dangerouslySetInnerHTML={{ __html: block.subtitle || "" }} />
      </div>
    </section>
  );
}

export default function PageSectionRenderer({ sections }: Props) {
  const active = sections
    .filter((s) => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (active.length === 0) return null;

  return (
    <>
      {active.map((section) => {
        switch (section.type) {
          case "carousel_style_1":
            return (
              <CarouselStyle1
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                blocks={section.blocks || []}
              />
            );
          case "carousel_style_2":
            return (
              <CarouselStyle2
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                blocks={section.blocks || []}
              />
            );
          case "carousel_style_3":
            return (
              <CarouselStyle3
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                blocks={section.blocks || []}
              />
            );
          case "banner":
            return <BannerRenderer key={section.id} section={section} />;
          case "featured_products":
            return (
              <FeaturedProductsRenderer key={section.id} section={section} />
            );
          case "story":
            return <StoryRenderer key={section.id} section={section} />;
          case "html":
            return <HtmlRenderer key={section.id} section={section} />;
          default:
            return (
              <CarouselStyle1
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                blocks={section.blocks || []}
              />
            );
        }
      })}
    </>
  );
}
