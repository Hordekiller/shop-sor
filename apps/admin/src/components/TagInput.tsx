"use client";

import { useState, KeyboardEvent } from "react";
import { Icon } from "@iconify/react";

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TagInput({
  value,
  onChange,
  placeholder,
}: TagInputProps) {
  const [input, setInput] = useState("");

  const tags = value
    ? value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    const newVal = [...tags, trimmed].join(", ");
    onChange(newVal);
  };

  const removeTag = (index: number) => {
    const newVal = tags.filter((_, i) => i !== index).join(", ");
    onChange(newVal);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input) {
        addTag(input);
        setInput("");
      }
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border"
      style={{ borderColor: "var(--v-border)", background: "var(--v-bg)" }}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md"
          style={{
            background: "rgba(115,103,240,0.1)",
            color: "var(--v-primary)",
          }}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="hover:opacity-70"
          >
            <Icon icon="tabler:x" className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
        style={{ color: "var(--v-text)" }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input) {
            addTag(input);
            setInput("");
          }
        }}
        placeholder={
          tags.length === 0 ? placeholder || "تایپ کنید و Enter بزنید" : ""
        }
      />
    </div>
  );
}
