const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const MEDIA_BASE = API_URL.replace("/api/v1", "");

export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "https://placehold.co/200x200/e2e8f0/94a3b8?text=No+Image";
  if (path.startsWith("http")) return path;
  return `${MEDIA_BASE}${path}`;
}
