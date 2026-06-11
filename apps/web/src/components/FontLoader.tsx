"use client";

import { useEffect, useState } from "react";

export default function FontLoader() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [colorsLoaded, setColorsLoaded] = useState(false);

  useEffect(() => {
    // Load fonts CSS
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    fetch(`${baseUrl}/fonts/css`)
      .then((res) => res.text())
      .then((css) => {
        const style = document.createElement("style");
        style.textContent = css;
        style.setAttribute("data-fonts", "");
        document.head.appendChild(style);
        setFontsLoaded(true);
      })
      .catch(() => {});

    // Load global colors and inject as CSS variables
    fetch(`${baseUrl}/settings/public`)
      .then((res) => res.json())
      .then((settings) => {
        if (settings?.global_colors) {
          try {
            const colors = JSON.parse(settings.global_colors);
            const root = document.documentElement;
            root.style.setProperty("--pb-primary", colors.primary || "#ef4056");
            root.style.setProperty(
              "--pb-secondary",
              colors.secondary || "#19bfd3",
            );
            root.style.setProperty("--pb-text", colors.text || "#3f3f3f");
            root.style.setProperty("--pb-bg", colors.bg || "#f5f5f5");
            root.style.setProperty("--pb-muted", colors.muted || "#81858b");
            root.style.setProperty("--pb-success", colors.success || "#28C76F");
            root.style.setProperty("--pb-error", colors.error || "#FF4C51");
            root.style.setProperty("--pb-warning", colors.warning || "#FF9F43");
            // Also set dk- prefixed vars for backward compat
            root.style.setProperty("--dk-primary", colors.primary || "#ef4056");
            root.style.setProperty("--dk-text", colors.text || "#3f3f3f");
            root.style.setProperty("--dk-bg", colors.bg || "#f5f5f5");
          } catch {}
        }
        setColorsLoaded(true);
      })
      .catch(() => {});
  }, []);

  return null;
}
