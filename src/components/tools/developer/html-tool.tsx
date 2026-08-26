"use client";

import { CodeToolShell, formatWithPrettier, minifyHtml, prettierPlugins } from "./code-tool-shell";

export default function HtmlTool({ mode = "format" }: { mode?: string }) {
  return (
    <CodeToolShell
      slug={mode === "format" ? "html-formatter" : "html-minifier"}
      mode={mode === "minify" ? "minify" : "format"}
      inputPlaceholder={"<!DOCTYPE html>\n<html><head><title>Page</title></head><body><h1>Hello</h1><p>World</p></body></html>"}
      runLabel={mode === "minify" ? "Minify HTML" : "Format HTML"}
      transform={async (input) => {
        if (mode === "minify") return minifyHtml(input);
        const plugins = await prettierPlugins();
        return formatWithPrettier(input, "html", plugins);
      }}
    />
  );
}
