"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { copyText, saveBlob } from "@/lib/download";
import { trackToolUse } from "@/lib/track";

async function renderMarkdown(md: string): Promise<string> {
  const { marked } = await import("marked");
  const DOMPurify = (await import("dompurify")).default;
  const raw = await marked.parse(md, { gfm: true, breaks: true });
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
}

export default function MarkdownToHtmlTool() {
  const [markdown, setMarkdown] = useState("");
  const [html, setHtml] = useState("");
  const [styled, setStyled] = useState(true);

  const preview = useMemo(() => {
    if (!html) return "";
    if (!styled) return html;
    return `<div style="font-family:system-ui,sans-serif;max-width:42rem;margin:0 auto;line-height:1.65;color:#0f172a">
<style>
  h1,h2,h3{line-height:1.25;margin:1.4em 0 .5em}
  code{background:#f1f5f9;padding:.15em .4em;border-radius:4px;font-size:.9em}
  pre{background:#0f172a;color:#e2e8f0;padding:1em;border-radius:8px;overflow:auto}
  pre code{background:none;color:inherit}
  blockquote{border-left:3px solid #2563eb;margin:1em 0;padding:.2em 1em;color:#64748b}
  table{border-collapse:collapse}
  th,td{border:1px solid #e2e8f0;padding:.5em .8em}
  img{max-width:100%}
</style>
${html}
</div>`;
  }, [html, styled]);

  const convert = async () => {
    try {
      const result = await renderMarkdown(markdown);
      setHtml(result);
      trackToolUse("markdown-to-html");
    } catch {
      toast.error("The Markdown could not be parsed. Check for unclosed tags.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="md-input" className="text-[13px] font-medium text-foreground">Markdown</label>
            <span className="text-xs text-muted-foreground">{markdown.length.toLocaleString()} chars</span>
          </div>
          <textarea
            id="md-input"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder={"# Heading\n\n**Bold** and *italic* text\n\n- List item\n\n[Link](https://example.com)\n\n```js\ncode block\n```"}
            className="focus-ring min-h-72 w-full resize-y rounded-xl border bg-card p-4 font-mono text-[13px] leading-relaxed placeholder:font-sans placeholder:text-muted-foreground scrollbar-thin"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="md-output" className="text-[13px] font-medium text-foreground">HTML output</label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" checked={styled} onChange={(e) => setStyled(e.target.checked)} className="h-3.5 w-3.5 accent-[rgb(37_99_235)]" />
              With inline styles
            </label>
          </div>
          <Tabs defaultValue="code" className="h-full">
            <TabsList className="mb-2">
              <TabsTrigger value="code">HTML code</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="code">
              <output
                id="md-output"
                className="block h-64 overflow-auto rounded-xl border bg-muted/40 p-4 font-mono text-[12px] leading-relaxed whitespace-pre-wrap scrollbar-thin lg:h-[calc(18rem+1.5rem)]"
                aria-live="polite"
              >
                {html || <span className="font-sans text-muted-foreground">Converted HTML appears here…</span>}
              </output>
            </TabsContent>
            <TabsContent value="preview">
              <div
                className="h-64 overflow-auto rounded-xl border bg-white p-4 text-sm text-slate-900 shadow-inner scrollbar-thin [&_a]:text-blue-600 [&_a]:underline lg:h-[calc(18rem+1.5rem)]"
                // Sanitized with DOMPurify before insertion
                dangerouslySetInnerHTML={{ __html: preview || "<p style='color:#94a3b8'>Preview appears here after converting…</p>" }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Button onClick={() => void convert()} disabled={!markdown.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Convert Markdown to HTML
        </Button>
        <Button variant="outline" disabled={!html} onClick={() => void copyText(styled ? preview : html).then(() => toast.success("HTML copied"))}>
          <Copy size={14} className="mr-1.5" /> Copy HTML
        </Button>
        <Button
          variant="outline"
          disabled={!html}
          onClick={() => saveBlob(new Blob([styled ? preview : html], { type: "text/html;charset=utf-8" }), "converted.html")}
        >
          <Download size={14} className="mr-1.5" /> Download .html
        </Button>
      </div>
    </div>
  );
}
