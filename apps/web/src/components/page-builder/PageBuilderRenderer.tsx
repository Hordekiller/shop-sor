"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faPlay,
  faClock,
  faStar,
  faShoppingCart,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "@/lib/api";
import {
  mediaUrl,
  srcsetFromUrl,
  defaultSizes,
  productCardSizes,
} from "@/lib/media";

// Client-side sanitize — needs to be lazy-loaded
function sanitizeHTML(html: string): string {
  if (typeof window === "undefined") return html;
  // Use a simple div-based sanitizer (no external deps needed at runtime)
  const el = document.createElement("div");
  el.textContent = html;
  const raw = el.innerHTML;
  // Allow safe tags only
  const tmp = document.createElement("div");
  tmp.innerHTML = raw;
  const allowedTags = new Set([
    "p",
    "br",
    "b",
    "i",
    "u",
    "strong",
    "em",
    "a",
    "ul",
    "ol",
    "li",
    "span",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "img",
    "blockquote",
    "pre",
    "code",
    "hr",
    "sub",
    "sup",
    "small",
    "mark",
    "del",
    "ins",
  ]);
  const walk = (node: Node): Node => {
    const fragment = document.createDocumentFragment();
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        fragment.appendChild(document.createTextNode(child.textContent || ""));
        return;
      }
      const el = child as HTMLElement;
      if (allowedTags.has(el.tagName.toLowerCase())) {
        const clone = document.createElement(el.tagName.toLowerCase());
        if (el.tagName.toLowerCase() === "a") {
          const href = el.getAttribute("href");
          if (
            href &&
            !href.startsWith("javascript:") &&
            !href.startsWith("data:")
          )
            clone.setAttribute("href", href);
          if (el.getAttribute("target"))
            clone.setAttribute("target", el.getAttribute("target")!);
          if (el.getAttribute("rel"))
            clone.setAttribute("rel", el.getAttribute("rel")!);
        }
        if (el.tagName.toLowerCase() === "img") {
          const src = el.getAttribute("src");
          if (src && !src.startsWith("javascript:") && !src.startsWith("data:"))
            clone.setAttribute("src", src);
          if (el.getAttribute("alt"))
            clone.setAttribute("alt", el.getAttribute("alt")!);
        }
        Array.from(el.attributes).forEach((attr) => {
          if (
            ["style", "class", "id", "dir", "lang", "title"].includes(attr.name)
          ) {
            clone.setAttribute(attr.name, attr.value);
          }
        });
        clone.appendChild(walk(child));
        fragment.appendChild(clone);
      } else {
        fragment.appendChild(document.createTextNode(el.textContent || ""));
      }
    });
    return fragment;
  };
  const result = document.createElement("div");
  result.appendChild(walk(tmp));
  return result.innerHTML;
}

interface Section {
  id: string;
  settings: any;
  columns: Column[];
}
interface Column {
  id: string;
  settings: any;
  widgets: Widget[];
}
interface Widget {
  id: string;
  type: string;
  variant: number;
  settings: any;
  style: any;
  responsive: any;
  seo?: any;
}

interface PageContent {
  schema_version: number;
  sections: Section[];
}

export default function PageBuilderRenderer({
  contentJson,
  globalColors: gc,
}: {
  contentJson: string;
  globalColors?: any;
}) {
  const [content, setContent] = useState<PageContent | null>(null);

  useEffect(() => {
    try {
      setContent(JSON.parse(contentJson));
    } catch {
      setContent(null);
    }
  }, [contentJson]);

  if (!content) return null;

  const colors = gc || {};
  const cssVars = {
    "--pb-primary": colors.primary || "#ef4056",
    "--pb-secondary": colors.secondary || "#19bfd3",
    "--pb-text": colors.text || "#3f3f3f",
    "--pb-bg": colors.bg || "#f5f5f5",
    "--pb-muted": colors.muted || "#81858b",
    "--pb-success": colors.success || "#28C76F",
    "--pb-error": colors.error || "#FF4C51",
    "--pb-warning": colors.warning || "#FF9F43",
  } as React.CSSProperties;

  return (
    <div style={cssVars}>
      {content.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}

function SectionRenderer({ section }: { section: Section }) {
  const { settings } = section;
  const style: React.CSSProperties = {};
  if (settings.background?.mode === "custom")
    style.background = settings.background.value;
  if (settings.background?.mode === "gradient")
    style.background = `linear-gradient(${settings.background.angle}deg, ${settings.background.from}, ${settings.background.to})`;
  if (settings.padding)
    style.padding = `${settings.padding.top}px ${settings.padding.right}px ${settings.padding.bottom}px ${settings.padding.left}px`;
  if (settings.margin)
    style.margin = `${settings.margin.top}px ${settings.margin.right}px ${settings.margin.bottom}px ${settings.margin.left}px`;
  if (settings.full_width) style.width = "100%";

  const innerStyle: React.CSSProperties = {};
  if (!settings.full_width && settings.max_width) {
    innerStyle.maxWidth = settings.max_width;
    innerStyle.marginLeft = "auto";
    innerStyle.marginRight = "auto";
  }

  const Wrapper = settings.full_width ? "div" : "div";

  return (
    <Wrapper style={style}>
      <div
        style={innerStyle}
        className={!settings.full_width ? "dk-container" : ""}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: section.columns?.[0]?.settings?.vertical_align || "top",
          }}
        >
          {(section.columns || []).map((col) => (
            <ColumnRenderer key={col.id} column={col} />
          ))}
        </div>
      </div>
    </Wrapper>
  );
}

function ColumnRenderer({ column }: { column: Column }) {
  const ratio = column.settings.width_ratio || 1;
  const flex = `${ratio} 1 0`;
  return (
    <div style={{ flex, minWidth: 0 }}>
      {(column.widgets || []).map((widget) => (
        <WidgetRenderer key={widget.id} widget={widget} />
      ))}
    </div>
  );
}

function WidgetRenderer({ widget }: { widget: Widget }) {
  const responsive = widget.responsive;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1024;
      const bp = w >= 1024 ? "desktop" : w >= 768 ? "tablet" : "mobile";
      const layer = responsive?.[bp];
      setHidden(layer?.visible === false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [responsive]);

  if (hidden) return null;

  const style: React.CSSProperties = {};
  if (widget.style?.padding)
    style.padding = `${widget.style.padding.top}px ${widget.style.padding.right}px ${widget.style.padding.bottom}px ${widget.style.padding.left}px`;
  if (widget.style?.margin)
    style.margin = `${widget.style.margin.top}px ${widget.style.margin.right}px ${widget.style.margin.bottom}px ${widget.style.margin.left}px`;
  if (widget.style?.border_radius)
    style.borderRadius = widget.style.border_radius;
  if (widget.type === "spacer")
    return <div style={{ height: widget.settings.height || 32 }} />;

  const content = renderWidgetByType(widget);

  return <div style={style}>{content}</div>;
}

function renderWidgetByType(widget: Widget): React.ReactNode {
  const s = widget.settings || {};
  const v = widget.variant || 1;

  switch (widget.type) {
    case "heading":
      return <HeadingWidget s={s} v={v} />;
    case "text":
      return <TextWidget s={s} v={v} />;
    case "image":
      return <ImageWidget s={s} v={v} />;
    case "button":
      return <ButtonWidget s={s} v={v} />;
    case "icon_box":
      return <IconBoxWidget s={s} v={v} />;
    case "video":
      return <VideoWidget s={s} v={v} />;
    case "accordion":
      return <AccordionWidget s={s} v={v} />;
    case "tabs":
      return <TabsWidget s={s} v={v} />;
    case "gallery":
      return <GalleryWidget s={s} v={v} />;
    case "banner_slider":
      return <BannerSliderWidget s={s} v={v} />;
    case "product_carousel":
      return <ProductCarouselWidget s={s} v={v} />;
    case "product_grid":
      return <ProductGridWidget s={s} v={v} />;
    case "category_nav":
      return <CategoryNavWidget s={s} v={v} />;
    case "brand_slider":
      return <BrandSliderWidget s={s} v={v} />;
    case "countdown":
      return <CountdownWidget s={s} v={v} />;
    case "blog_posts":
      return <BlogPostsWidget s={s} v={v} />;
    default:
      return (
        <div className="text-sm text-gray-400 p-4">
          ویجت ناشناخته: {widget.type}
        </div>
      );
  }
}

// ─── Widget Components ───

function HeadingWidget({ s, v }: { s: any; v: number }) {
  const level = s.seo?.heading_level || "h2";
  const link = s.link?.url;
  const headingStyle: React.CSSProperties = {
    margin: 0,
    fontSize: s.typography?.size || 24,
    fontWeight: s.typography?.weight || 700,
    lineHeight: s.typography?.line_height || 1.4,
    textAlign: (s.typography?.align || "right") as any,
    color: "var(--pb-text)",
  };
  const children = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        ...(v === 3 ? { justifyContent: "space-between" } : {}),
      }}
    >
      {level === "h1" ? (
        <h1 style={headingStyle}>{s.text}</h1>
      ) : level === "h2" ? (
        <h2 style={headingStyle}>{s.text}</h2>
      ) : level === "h3" ? (
        <h3 style={headingStyle}>{s.text}</h3>
      ) : level === "h4" ? (
        <h4 style={headingStyle}>{s.text}</h4>
      ) : (
        <h2 style={headingStyle}>{s.text}</h2>
      )}
      {v === 2 && (
        <div style={{ flex: 1, height: 2, background: "var(--pb-primary)" }} />
      )}
      {v === 3 && link && (
        <Link
          href={link}
          style={{
            fontSize: 13,
            color: "var(--pb-primary)",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          مشاهده همه{" "}
          <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
  return <div style={{ marginBottom: 16 }}>{children}</div>;
}

function TextWidget({ s, v }: { s: any; v: number }) {
  const style: React.CSSProperties = {
    fontSize: s.typography?.size || 14,
    lineHeight: s.typography?.line_height || 1.8,
    color: "var(--pb-text)",
    textAlign: (s.typography?.align || "right") as any,
  };
  if (v === 2) style.columnCount = 2;
  if (v === 3)
    return (
      <div
        className="rounded-xl p-4"
        style={{
          background: "var(--pb-bg)",
          borderRight: "4px solid var(--pb-primary)",
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: sanitizeHTML(s.html || "") }}
      />
    );
  return (
    <div
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizeHTML(s.html || "") }}
    />
  );
}

function ImageWidget({ s, v }: { s: any; v: number }) {
  const src = s.image?.media_id || "";
  const img = (
    <img
      src={mediaUrl(src)}
      alt={s.image?.alt || ""}
      loading="lazy"
      srcSet={srcsetFromUrl(src)}
      sizes={defaultSizes()}
      style={{
        width: "100%",
        borderRadius: 12,
        ...(v === 3 ? { transition: "transform 0.3s" } : {}),
      }}
      className={v === 3 ? "hover:scale-105" : ""}
    />
  );
  if (v === 2)
    return (
      <figure>
        {img}
        <figcaption
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--pb-muted)",
            marginTop: 8,
          }}
        >
          {s.caption}
        </figcaption>
      </figure>
    );
  return s.link?.url ? <Link href={s.link.url}>{img}</Link> : img;
}

function ButtonWidget({ s, v }: { s: any; v: number }) {
  const sizeMap: Record<string, string> = {
    sm: "8px 16px",
    md: "12px 24px",
    lg: "16px 32px",
  };
  const btnStyle: React.CSSProperties = {
    padding: sizeMap[s.size || "md"] || "12px 24px",
    borderRadius: 8,
    fontSize: s.size === "sm" ? 13 : s.size === "lg" ? 16 : 14,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.2s",
  };
  if (v === 1 || v === 3) {
    btnStyle.background = "var(--pb-primary)";
    btnStyle.color = "#fff";
    btnStyle.border = "none";
  }
  if (v === 2) {
    btnStyle.background = "transparent";
    btnStyle.color = "var(--pb-primary)";
    btnStyle.border = "2px solid var(--pb-primary)";
  }
  if (s.full_width) btnStyle.width = "100%";
  btnStyle.justifyContent = "center";
  const content = (
    <>
      {s.icon && <span>{s.icon}</span>}
      {s.text}
    </>
  );
  return s.link?.url ? (
    <Link href={s.link.url} style={btnStyle}>
      {content}
    </Link>
  ) : (
    <button style={btnStyle}>{content}</button>
  );
}

function IconBoxWidget({ s, v }: { s: any; v: number }) {
  const style: React.CSSProperties = {
    display: "flex",
    gap: 12,
    alignItems: "center",
  };
  if (v === 1) style.flexDirection = "column";
  style.textAlign = "center";
  const content = (
    <>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--pb-primary)",
          color: "#fff",
          fontSize: 24,
        }}
      >
        {s.icon}
      </div>
      <div>
        <strong style={{ display: "block", marginBottom: 4 }}>{s.title}</strong>
        {s.desc && (
          <span style={{ fontSize: 13, color: "var(--pb-muted)" }}>
            {s.desc}
          </span>
        )}
      </div>
    </>
  );
  if (v === 3)
    return (
      <div className="dk-card p-4" style={{ textAlign: "center" }}>
        {content}
      </div>
    );
  return <div style={style}>{content}</div>;
}

function VideoWidget({ s, v }: { s: any; v: number }) {
  if (s.source === "youtube" && s.url) {
    const embed = s.url
      .replace("watch?v=", "embed/")
      .replace("youtu.be/", "youtube.com/embed/");
    return (
      <div
        style={{
          position: "relative",
          paddingBottom: "56.25%",
          height: 0,
          borderRadius: v === 3 ? 12 : 0,
          overflow: "hidden",
          boxShadow: v === 3 ? "0 4px 20px rgba(0,0,0,0.1)" : "none",
        }}
      >
        <iframe
          src={embed}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
          allowFullScreen
        />
      </div>
    );
  }
  if (s.source === "upload" && s.media_id) {
    return (
      <div style={{ position: "relative" }}>
        <video
          controls
          style={{ width: "100%", borderRadius: v === 3 ? 12 : 0 }}
          poster={mediaUrl(s.poster?.media_id) || ""}
        >
          <source src={mediaUrl(s.media_id)} />
        </video>
        {v === 2 && !s.autoplay && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesomeIcon icon={faPlay} className="w-6 h-6 text-white" />
            </div>
          </div>
        )}
      </div>
    );
  }
  return <div className="text-sm text-gray-400 p-4">ویدیو یافت نشد</div>;
}

function AccordionWidget({ s, v }: { s: any; v: number }) {
  const [open, setOpen] = useState<number[]>([]);
  const toggle = (i: number) =>
    setOpen((prev) =>
      s.allow_multiple
        ? prev.includes(i)
          ? prev.filter((x) => x !== i)
          : [...prev, i]
        : prev.includes(i)
          ? []
          : [i],
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {(s.items || []).map((item: any, i: number) => (
        <div
          key={i}
          className="rounded-xl"
          style={{
            border: "1px solid var(--pb-border, #e0e0e6)",
            overflow: "hidden",
            ...(v === 2 ? { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" } : {}),
          }}
        >
          <button
            onClick={() => toggle(i)}
            style={{
              width: "100%",
              textAlign: "right",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            <span>
              {v === 3 ? `${i + 1}. ` : ""}
              {item.title}
            </span>
            <span
              style={{
                transform: open.includes(i) ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            >
              {s.style === "plus" ? (open.includes(i) ? "−" : "+") : "▼"}
            </span>
          </button>
          {open.includes(i) && (
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--pb-border, #e0e0e6)",
                fontSize: 14,
                lineHeight: 1.8,
              }}
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(item.content_html),
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function TabsWidget({ s, v }: { s: any; v: number }) {
  const [active, setActive] = useState(0);
  const isVertical = s.orientation === "vertical";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isVertical ? "row" : "column",
        gap: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          gap: 2,
          borderBottom: isVertical
            ? "none"
            : "2px solid var(--pb-border, #e0e0e6)",
          ...(isVertical
            ? { borderLeft: "2px solid var(--pb-border, #e0e0e6)" }
            : {}),
        }}
      >
        {(s.tabs || []).map((tab: any, i: number) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: active === i ? 600 : 400,
              color: active === i ? "var(--pb-primary)" : "var(--pb-muted)",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom:
                !isVertical && active === i
                  ? "2px solid var(--pb-primary)"
                  : "2px solid transparent",
              marginBottom: !isVertical ? -2 : 0,
              borderLeft:
                isVertical && active === i
                  ? "2px solid var(--pb-primary)"
                  : "2px solid transparent",
              marginLeft: isVertical ? -2 : 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {v === 3 && <span>{tab.icon || "📄"}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div
        style={{ padding: 16, fontSize: 14, lineHeight: 1.8 }}
        dangerouslySetInnerHTML={{
          __html: sanitizeHTML(s.tabs?.[active]?.content_html || ""),
        }}
      />
    </div>
  );
}

function GalleryWidget({ s, v }: { s: any; v: number }) {
  const images = s.images || [];
  if (v === 3) {
    const [idx, setIdx] = useState(0);
    if (!images.length)
      return <div className="text-sm text-gray-400">گالری خالی</div>;
    return (
      <div
        style={{ position: "relative", overflow: "hidden", borderRadius: 12 }}
      >
        <div
          style={{
            display: "flex",
            transition: "transform 0.3s",
            transform: `translateX(-${idx * 100}%)`,
          }}
        >
          {images.map((img: any, i: number) => (
            <img
              key={i}
              src={mediaUrl(img.media_id)}
              alt={img.alt || ""}
              loading="lazy"
              srcSet={srcsetFromUrl(img.media_id)}
              sizes={defaultSizes()}
              style={{ minWidth: "100%", height: 300, objectFit: "cover" }}
            />
          ))}
        </div>
        {images.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 6,
            }}
          >
            {images.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: "none",
                  background:
                    i === idx ? "var(--pb-primary)" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${s.columns || 3}, 1fr)`,
        gap: s.gap || 8,
      }}
    >
      {images.map((img: any, i: number) => (
        <img
          key={i}
          src={mediaUrl(img.media_id)}
          alt={img.alt || ""}
          loading="lazy"
          srcSet={srcsetFromUrl(img.media_id)}
          sizes={defaultSizes()}
          style={{
            width: "100%",
            borderRadius: 8,
            ...(v === 2 ? { objectFit: "cover" } : {}),
          }}
        />
      ))}
    </div>
  );
}

function BannerSliderWidget({ s, v }: { s: any; v: number }) {
  const [idx, setIdx] = useState(0);
  const slides = s.slides || [];
  useEffect(() => {
    if (!s.autoplay || slides.length <= 1) return;
    const t = setInterval(
      () => setIdx((prev) => (prev + 1) % slides.length),
      4000,
    );
    return () => clearInterval(t);
  }, [s.autoplay, slides.length]);
  if (!slides.length) return null;
  const slide = slides[idx];
  const height =
    typeof window !== "undefined" && window.innerWidth < 768
      ? s.height_mobile || 250
      : s.height_desktop || 400;
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 12,
        height,
      }}
    >
      <img
        src={mediaUrl(slide.image?.media_id)}
        alt={slide.image?.alt || ""}
        loading="lazy"
        srcSet={srcsetFromUrl(slide.image?.media_id)}
        sizes="100vw"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          position: "absolute",
          inset: 0,
        }}
      />
      {(slide.title || slide.subtitle || slide.button_text) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(0,0,0,0.3)",
            color: "#fff",
            padding: 24,
            textAlign: "center",
          }}
        >
          {slide.title && (
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
              {slide.title}
            </h2>
          )}
          {slide.subtitle && (
            <p style={{ fontSize: 16, marginBottom: 16 }}>{slide.subtitle}</p>
          )}
          {slide.button_text && slide.link?.url && (
            <Link
              href={slide.link.url}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                background: "var(--pb-primary)",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              {slide.button_text}
            </Link>
          )}
        </div>
      )}
      {(s.navigation === "dots" || s.navigation === "both") && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 6,
          }}
        >
          {slides.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: "2px solid #fff",
                background: i === idx ? "#fff" : "transparent",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CountdownWidget({ s, v }: { s: any; v: number }) {
  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  useEffect(() => {
    const target = new Date(s.target_date).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [s.target_date]);
  const box = (label: string, val: number) => (
    <div style={{ textAlign: "center", minWidth: 56 }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--pb-text)",
          background: "var(--pb-bg)",
          borderRadius: 8,
          padding: "8px 12px",
          ...(v === 1 ? {} : {}),
        }}
      >
        {String(val).padStart(2, "0")}
      </div>
      <div style={{ fontSize: 11, color: "var(--pb-muted)", marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
  const boxContent = (
    <div
      style={{
        textAlign: "center",
        padding: 24,
        borderRadius: 12,
        ...(v === 2
          ? { background: "var(--pb-bg)" }
          : v === 3
            ? { background: "var(--pb-primary)", color: "#fff" }
            : {}),
      }}
    >
      {s.title && (
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          {s.title}
        </h3>
      )}
      {v === 2 ? (
        <p style={{ fontSize: 24, fontWeight: 700 }}>
          {String(time.days).padStart(2, "0")}:
          {String(time.hours).padStart(2, "0")}:
          {String(time.minutes).padStart(2, "0")}:
          {String(time.seconds).padStart(2, "0")}
        </p>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {box("روز", time.days)}
          {box("ساعت", time.hours)}
          {box("دقیقه", time.minutes)}
          {box("ثانیه", time.seconds)}
        </div>
      )}
    </div>
  );
  return s.link?.url ? (
    <Link
      href={s.link.url}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      {boxContent}
    </Link>
  ) : (
    boxContent
  );
}

// ─── Data widgets (fetch products) ───

interface ProductItem {
  id: number;
  title: string;
  slug: string;
  price: number;
  salePrice?: number;
  images: string[];
  averageRating?: number;
}

function useProducts(data: any): ProductItem[] {
  const [products, setProducts] = useState<ProductItem[]>([]);
  useEffect(() => {
    if (!data) return;
    if (data.mode === "manual" && data.ids?.length) {
      api
        .get<ProductItem[]>(`/products?ids=${data.ids.join(",")}`)
        .then(setProducts)
        .catch(() => {});
    } else {
      const params = new URLSearchParams();
      if (data.filter?.by) params.set("sort", data.filter.by);
      if (data.filter?.category_ids?.length)
        params.set("categoryIds", data.filter.category_ids.join(","));
      if (data.filter?.brand_ids?.length)
        params.set("brandIds", data.filter.brand_ids.join(","));
      if (data.limit) params.set("limit", String(data.limit));
      api
        .get<ProductItem[]>(`/products?${params}`)
        .then(setProducts)
        .catch(() => {});
    }
  }, [data]);
  return products;
}

function ProductCarouselWidget({ s, v }: { s: any; v: number }) {
  const products = useProducts(s.data);

  if (v === 2) {
    return (
      <div
        className="dk-card overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #e53e3e, #c53030)",
          color: "#fff",
          borderRadius: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: 20,
          }}
        >
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700 }}>
              {s.title || "پیشنهاد شگفت‌انگیز"}
            </h3>
            <CountdownWidget
              s={{
                target_date: new Date(Date.now() + 86400000 * 2).toISOString(),
                title: "",
                style: "blocks",
              }}
              v={1}
            />
          </div>
          <div
            style={{ flex: 2, display: "flex", gap: 12, overflow: "hidden" }}
          >
            {products.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                style={{
                  minWidth: 140,
                  background: "#fff",
                  borderRadius: 12,
                  padding: 8,
                  textDecoration: "none",
                  color: "var(--dk-text)",
                }}
              >
                <img
                  src={mediaUrl(p.images?.[0])}
                  alt={p.title}
                  loading="lazy"
                  srcSet={srcsetFromUrl(p.images?.[0])}
                  sizes={productCardSizes({ desktop: 6, tablet: 4, mobile: 2 })}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    objectFit: "contain",
                  }}
                />
                <p style={{ fontSize: 11, lineClamp: 2, marginTop: 4 }}>
                  {p.title}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#e53e3e",
                    marginTop: 4,
                  }}
                >
                  {p.salePrice?.toLocaleString() || p.price.toLocaleString()}{" "}
                  تومان
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {s.title && (
        <HeadingWidget
          s={{
            text: s.title,
            typography: { size: 18, weight: 700 },
            link: s.link,
          }}
          v={3}
        />
      )}
      <div
        style={{ display: "flex", gap: 12, overflow: "auto", paddingBottom: 8 }}
      >
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            style={{
              minWidth: v === 3 ? 130 : 170,
              textDecoration: "none",
              color: "var(--dk-text)",
            }}
          >
            <div className="dk-card overflow-hidden">
              <img
                src={mediaUrl(p.images?.[0])}
                alt={p.title}
                loading="lazy"
                srcSet={srcsetFromUrl(p.images?.[0])}
                sizes={productCardSizes({ desktop: 6, tablet: 4, mobile: 2 })}
                style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
              />
              <div style={{ padding: 8 }}>
                <p style={{ fontSize: 12, lineClamp: 2 }}>{p.title}</p>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--dk-primary)",
                    marginTop: 4,
                  }}
                >
                  {p.salePrice?.toLocaleString() || p.price.toLocaleString()}{" "}
                  تومان
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ProductGridWidget({ s, v }: { s: any; v: number }) {
  const products = useProducts(s.data);
  const cols = s.columns || 4;
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: s.gap || 16,
        }}
      >
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            style={{ textDecoration: "none", color: "var(--dk-text)" }}
          >
            <div
              className={`dk-card overflow-hidden ${v === 2 ? "hover:shadow-lg transition-shadow" : ""}`}
            >
              <img
                src={mediaUrl(p.images?.[0])}
                alt={p.title}
                loading="lazy"
                srcSet={srcsetFromUrl(p.images?.[0])}
                sizes={productCardSizes({
                  desktop: cols,
                  tablet: 3,
                  mobile: 2,
                })}
                style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
              />
              <div style={{ padding: 8 }}>
                <p style={{ fontSize: 12, lineClamp: 2 }}>{p.title}</p>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--dk-primary)",
                    marginTop: 4,
                  }}
                >
                  {p.salePrice?.toLocaleString() || p.price.toLocaleString()}{" "}
                  تومان
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CategoryNavWidget({ s, v }: { s: any; v: number }) {
  const [cats, setCats] = useState<any[]>([]);
  useEffect(() => {
    const ids = (s.categories || []).map((c: any) => c.id).filter(Boolean);
    if (ids.length)
      api
        .get<any[]>(`/categories?ids=${ids.join(",")}`)
        .then(setCats)
        .catch(() => {});
    else
      api
        .get<any[]>("/categories")
        .then(setCats)
        .catch(() => {});
  }, [s.categories]);
  const isCircle = s.type !== "square";
  return (
    <div
      style={{ display: "flex", gap: 12, overflow: "auto", padding: "8px 0" }}
    >
      {cats.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.id}`}
          style={{
            textDecoration: "none",
            color: "var(--dk-text)",
            textAlign: "center",
            minWidth: isCircle ? 80 : 100,
          }}
        >
          <div
            style={{
              width: isCircle ? 64 : 80,
              height: isCircle ? 64 : 80,
              borderRadius: isCircle ? "50%" : 16,
              background: "var(--dk-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 6px",
              ...(v === 3
                ? { background: "none", border: "1px solid var(--dk-border)" }
                : {}),
            }}
          >
            {cat.image ? (
              <img
                src={mediaUrl(cat.image)}
                alt={cat.name}
                loading="lazy"
                srcSet={srcsetFromUrl(cat.image)}
                sizes="80px"
                style={{ width: "60%", height: "60%", objectFit: "contain" }}
              />
            ) : (
              <span style={{ fontSize: 20 }}>📁</span>
            )}
          </div>
          <span style={{ fontSize: 11, display: "block", lineHeight: 1.3 }}>
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  );
}

function BrandSliderWidget({ s, v }: { s: any; v: number }) {
  const [brands, setBrands] = useState<any[]>([]);
  useEffect(() => {
    const ids = s.brand_ids || [];
    if (ids.length)
      api
        .get<any[]>(`/brands?ids=${ids.join(",")}`)
        .then(setBrands)
        .catch(() => {});
    else
      api
        .get<any[]>("/brands")
        .then(setBrands)
        .catch(() => {});
  }, [s.brand_ids]);
  return (
    <div
      style={{ display: "flex", gap: 16, overflow: "auto", padding: "12px 0" }}
    >
      {brands.map((b) => (
        <Link
          key={b.id}
          href={`/brands/${b.slug || b.id}`}
          style={{
            textDecoration: "none",
            textAlign: "center",
            minWidth: 100,
            ...(v === 3
              ? {
                  border: "1px solid var(--dk-border)",
                  borderRadius: 12,
                  padding: 12,
                }
              : {}),
          }}
        >
          {b.logo ? (
            <img
              src={mediaUrl(b.logo)}
              alt={b.name}
              loading="lazy"
              srcSet={srcsetFromUrl(b.logo)}
              sizes="64px"
              style={{
                width: 64,
                height: 64,
                objectFit: "contain",
                ...(s.grayscale ? { filter: "grayscale(1)" } : {}),
                ...(s.grayscale && v !== 2
                  ? { transition: "filter 0.3s" }
                  : {}),
              }}
              className={s.grayscale && v !== 2 ? "hover:filter-none" : ""}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--dk-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              {b.name}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}

function BlogPostsWidget({ s, v }: { s: any; v: number }) {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    const params = new URLSearchParams();
    if (s.data?.limit) params.set("limit", String(s.data.limit));
    api
      .get<any[]>(`/blog?${params}`)
      .then(setPosts)
      .catch(() => {});
  }, [s.data]);
  if (v === 3 && posts[0]) {
    const p = posts[0];
    return (
      <Link
        href={`/blog/${p.slug}`}
        style={{
          display: "block",
          position: "relative",
          height: 300,
          borderRadius: 12,
          overflow: "hidden",
          textDecoration: "none",
          color: "#fff",
        }}
      >
        <img
          src={mediaUrl(p.image)}
          alt={p.title}
          loading="lazy"
          srcSet={srcsetFromUrl(p.image)}
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            inset: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 24,
            background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
          }}
        >
          <h3 style={{ fontSize: 20, fontWeight: 700 }}>{p.title}</h3>
          {s.show_meta && (
            <p style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
              {new Date(p.createdAt).toLocaleDateString("fa-IR")}
            </p>
          )}
        </div>
      </Link>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: 16,
      }}
    >
      {posts.map((p) => (
        <Link
          key={p.id}
          href={`/blog/${p.slug}`}
          style={{ textDecoration: "none", color: "var(--dk-text)" }}
        >
          <div className="dk-card overflow-hidden">
            {p.image && (
              <img
                src={mediaUrl(p.image)}
                alt={p.title}
                loading="lazy"
                srcSet={srcsetFromUrl(p.image)}
                sizes="(max-width: 768px) 100vw, 250px"
                style={{ width: "100%", height: 160, objectFit: "cover" }}
              />
            )}
            <div style={{ padding: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, lineClamp: 2 }}>
                {p.title}
              </h3>
              {s.show_excerpt && p.excerpt && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--dk-text-light)",
                    marginTop: 4,
                    lineClamp: 2,
                  }}
                >
                  {p.excerpt}
                </p>
              )}
              {s.show_meta && (
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--dk-text-light)",
                    marginTop: 8,
                  }}
                >
                  {new Date(p.createdAt).toLocaleDateString("fa-IR")}
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
