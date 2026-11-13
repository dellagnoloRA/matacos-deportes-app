"use client";

import dynamic from "next/dynamic";
import React from "react";
import { Loader2 } from "lucide-react";
import type { RichTextEditorClientProps } from "./RichTextEditorClient";

export const RichTextEditor = dynamic(
  () =>
    import("./RichTextEditorClient").then((mod) => mod.RichTextEditorClient),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 rounded-xl border border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        <span className="text-xs font-medium">Cargando editor de texto TinyMCE...</span>
      </div>
    ),
  }
);
