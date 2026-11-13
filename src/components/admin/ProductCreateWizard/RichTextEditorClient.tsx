"use client";

import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";

export interface RichTextEditorClientProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export const RichTextEditorClient: React.FC<RichTextEditorClientProps> = ({
  value,
  onChange,
  placeholder = "Detalla los beneficios, sensación al uso, tecnologías patentadas e información relevante para el cliente...",
  height = 260,
}) => {
  const editorRef = useRef<unknown>(null);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all bg-white shadow-2xs">
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"
        onInit={(_evt, editor) => {
          editorRef.current = editor;
        }}
        value={value}
        onEditorChange={(newContent) => {
          onChange(newContent);
        }}
        init={{
          height,
          menubar: false,
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "charmap",
            "preview",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "table",
            "wordcount",
          ],
          toolbar:
            "undo redo | blocks | bold italic underline forecolor | " +
            "bullist numlist outdent indent | table | removeformat",
          content_style:
            "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #0f172a; line-height: 1.6; margin: 12px; } p { margin-bottom: 8px; } ul, ol { margin-left: 20px; margin-bottom: 8px; } h2, h3, h4 { font-weight: bold; margin-top: 12px; margin-bottom: 6px; }",
          branding: false,
          promotion: false,
          statusbar: true,
          placeholder,
          skin: "oxide",
        }}
      />
    </div>
  );
};

