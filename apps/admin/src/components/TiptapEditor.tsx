"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import PlaceholderExtension from "@tiptap/extension-placeholder";
import UnderlineExtension from "@tiptap/extension-underline";
import TextAlignExtension from "@tiptap/extension-text-align";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Icon } from "@iconify/react";

const lowlight = createLowlight(common);

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function TiptapEditor({
  value,
  onChange,
  placeholder = "متن را وارد کنید...",
  minHeight = 250,
}: TiptapEditorProps) {
  const [codeView, setCodeView] = useState(false);
  const [htmlCode, setHtmlCode] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      UnderlineExtension,
      ImageExtension.configure({ inline: true }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { dir: "ltr" },
      }),
      PlaceholderExtension.configure({ placeholder }),
      TextAlignExtension.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlCode(html);
      onChange(html);
    },
    editorProps: {
      attributes: { dir: "rtl" },
    },
  });

  const toggleCodeView = () => {
    if (codeView) {
      // Switching back to visual: parse HTML code
      if (editor) {
        editor.commands.setContent(htmlCode);
        onChange(htmlCode);
      }
    } else {
      // Switching to code view: sync current HTML
      if (editor) {
        setHtmlCode(editor.getHTML());
      }
    }
    setCodeView(!codeView);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const code = e.target.value;
    setHtmlCode(code);
    onChange(code);
  };

  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      try {
        const token = localStorage.getItem("atlas_token");
        const res = await fetch(
          `http://localhost:8000/api/v1/upload?sourceType=admin`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          },
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.url && editor) {
            editor.chain().focus().setImage({ src: data.url }).run();
          }
        }
      } catch {}
    };
    input.click();
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = prompt("آدرس لینک:", previousUrl || "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  if (!editor) return null;

  const ToolbarBtn = ({
    onClick,
    isActive,
    title,
    icon,
  }: {
    onClick: () => void;
    isActive?: boolean;
    title: string;
    icon: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={isActive ? "is-active" : ""}
      title={title}
    >
      <Icon icon={icon} className="w-4 h-4" />
    </button>
  );

  return (
    <div className="tiptap-editor">
      {!codeView && (
        <div className="tiptap-toolbar">
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="پررنگ"
            icon="tabler:bold"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="ایتالیک"
            icon="tabler:italic"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="زیرخط"
            icon="tabler:underline"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="خط خورده"
            icon="tabler:strikethrough"
          />
          <div className="toolbar-separator" />
          <ToolbarBtn
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            title="تیتر ۱"
            icon="tabler:h-1"
          />
          <ToolbarBtn
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            title="تیتر ۲"
            icon="tabler:h-2"
          />
          <ToolbarBtn
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            title="تیتر ۳"
            icon="tabler:h-3"
          />
          <div className="toolbar-separator" />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="لیست"
            icon="tabler:list"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="لیست شماره‌دار"
            icon="tabler:list-numbers"
          />
          <div className="toolbar-separator" />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="نقل قول"
            icon="tabler:blockquote"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            title="بلوک کد"
            icon="tabler:code"
          />
          <div className="toolbar-separator" />
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            title="راست چین"
            icon="tabler:align-right"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            title="وسط چین"
            icon="tabler:align-center"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            title="چپ چین"
            icon="tabler:align-left"
          />
          <div className="toolbar-separator" />
          <ToolbarBtn onClick={addImage} title="تصویر" icon="tabler:photo" />
          <ToolbarBtn
            onClick={setLink}
            isActive={editor.isActive("link")}
            title="لینک"
            icon="tabler:link"
          />
          <ToolbarBtn
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            title="جدول"
            icon="tabler:table"
          />
          <div className="toolbar-separator" />
          <ToolbarBtn
            onClick={() => editor.chain().focus().undo().run()}
            title="بازگشت"
            icon="tabler:arrow-back-up"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().redo().run()}
            title="جلو"
            icon="tabler:arrow-forward-up"
          />
          <div className="toolbar-separator" />
          <ToolbarBtn
            onClick={toggleCodeView}
            isActive={codeView}
            title="مشاهده کد"
            icon="tabler:code"
          />
        </div>
      )}
      {codeView ? (
        <div className="tiptap-code-view">
          <div
            className="flex items-center justify-between px-3 py-1.5 text-xs"
            style={{ background: "#2d2d3f", color: "#a0a0b0" }}
          >
            <span>HTML</span>
            <button
              type="button"
              onClick={toggleCodeView}
              style={{ color: "var(--v-primary)" }}
            >
              <Icon icon="tabler:arrow-left" className="w-3.5 h-3.5" />
              بازگشت به ویرایشگر
            </button>
          </div>
          <textarea
            value={htmlCode}
            onChange={handleCodeChange}
            spellCheck={false}
            style={{ minHeight: `${minHeight}px` }}
          />
        </div>
      ) : (
        <EditorContent
          editor={editor}
          style={{ minHeight: `${minHeight}px` }}
        />
      )}
    </div>
  );
}
