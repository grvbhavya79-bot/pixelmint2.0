"use client";

import { CodeToolShell, formatCss, minifyCss } from "./code-tool-shell";

export default function CssTool({ mode = "format" }: { mode?: string }) {
  return (
    <CodeToolShell
      slug={mode === "format" ? "css-formatter" : "css-minifier"}
      mode={mode === "minify" ? "minify" : "format"}
      inputPlaceholder={".card{border-radius:12px;padding:16px}.card:hover{transform:translateY(-2px)}"}
      runLabel={mode === "minify" ? "Minify CSS" : "Format CSS"}
      transform={(input) => (mode === "minify" ? minifyCss(input) : formatCss(input))}
    />
  );
}
