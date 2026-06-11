export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
export const MEDIA_URL =
  process.env.NEXT_PUBLIC_MEDIA_URL || "http://localhost:8000";

/** Thumbnail sizes mapped to their max-width in px */
export const THUMB_SIZES = {
  thumbnail: 150,
  small: 300,
  medium: 600,
  large: 900,
  xlarge: 1200,
} as const;

export type ThumbSize = keyof typeof THUMB_SIZES;

export function mediaUrl(path: unknown): string {
  if (!path) return "https://placehold.co/200x200/e2e8f0/94a3b8?text=No+Image";
  if (typeof path === "string") {
    if (path.startsWith("http")) return path;
    return `${MEDIA_URL}${path}`;
  }
  if (typeof path === "object" && path !== null) {
    if (Array.isArray(path)) {
      return mediaUrl(path[0]);
    }
    const obj = path as Record<string, unknown>;
    if (typeof obj.url === "string") return mediaUrl(obj.url);
    if (typeof obj.src === "string") return mediaUrl(obj.src);
  }
  return "https://placehold.co/200x200/e2e8f0/94a3b8?text=No+Image";
}

/** Given an original image URL path, returns the thumbnail URL for the given size */
export function thumbUrl(
  path: string | null | undefined,
  size: ThumbSize,
): string {
  if (!path) return mediaUrl(null);
  const base = stripExtension(path);
  return `${MEDIA_URL}${base}-${size}.webp`;
}

/** Given an image URL path (raw or full), returns a srcset string with all available sizes */
export function srcsetFromUrl(path: string | null | undefined): string {
  if (!path) return "";
  // Strip MEDIA_URL prefix if the path is a full local URL
  const raw = path.startsWith(MEDIA_URL) ? path.slice(MEDIA_URL.length) : path;
  // Only generate srcset for local paths, not external URLs
  if (raw.startsWith("http")) return "";
  const base = stripExtension(raw);
  return Object.entries(THUMB_SIZES)
    .map(([name, px]) => `${MEDIA_URL}${base}-${name}.webp ${px}w`)
    .join(", ");
}

/** Default sizes attribute for responsive images */
export function defaultSizes(breakpoints?: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}): string {
  const s = breakpoints || {};
  return [
    `(max-width: 767px) ${s.mobile || "100vw"}`,
    `(max-width: 1023px) ${s.tablet || "50vw"}`,
    `${s.desktop || "33vw"}`,
  ].join(", ");
}

/** Product card sizes — small cards in a grid/carousel */
export function productCardSizes(cols?: {
  desktop?: number;
  tablet?: number;
  mobile?: number;
}): string {
  const c = cols || {};
  return [
    `(max-width: 767px) ${Math.round(100 / (c.mobile || 2))}vw`,
    `(max-width: 1023px) ${Math.round(100 / (c.tablet || 3))}vw`,
    `${Math.round(100 / (c.desktop || 6))}vw`,
  ].join(", ");
}

function stripExtension(url: string): string {
  // Remove directory and extension: /uploads/file.jpg -> /uploads/file
  const dot = url.lastIndexOf(".");
  return dot > url.lastIndexOf("/") ? url.slice(0, dot) : url;
}
