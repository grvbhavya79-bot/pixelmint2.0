"use client";

import { useState } from "react";
import { CheckCircle2, Copy, Minimize2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/download";

/**
 * Shared dual-pane editor used by the XML/HTML/CSS/JS/SQL tools.
 * transform() must throw with a friendly message on invalid input.
 */
export function CodeToolShell({
  slug,
  mode,
  inputPlaceholder,
  runLabel,
  transform,
  quickActions,
}: {
  slug: string;
  mode: "format" | "minify" | "validate";
  inputPlaceholder: string;
  runLabel: string;
  transform: (input: string) => Promise<string> | string;
  quickActions?: React.ReactNode;
}) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "invalid">("idle");
  const [error, setError] = useState<string | null>(null);

  const validateOnly = mode === "validate";

  const run = async () => {
    if (!input.trim()) return;
    setStatus("busy");
    setError(null);
    try {
      const result = await transform(input);
      setOutput(result);
      setStatus("idle");
      // dynamic import to avoid circular imports
      void import("@/lib/track").then((m) => m.trackToolUse(slug));
    } catch (err) {
      setOutput("");
      setStatus("invalid");
      setError(err instanceof Error ? err.message : "The input could not be processed.");
    }
  };

  const charSaved = input && output ? Math.max(0, input.length - output.length) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor={`ct-${slug}-input`} className="text-[13px] font-medium text-foreground">Input</label>
            {input.trim() && status !== "busy" && (
              status === "invalid" ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                  <XCircle size={13} /> Problems found
                </span>
              ) : (
                output && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                    <CheckCircle2 size={13} /> {validateOnly ? "Well-formed" : "Processed"}
                  </span>
                )
              )
            )}
          </div>
          <textarea
            id={`ct-${slug}-input`}
            value={input}
            onChange={(e) => { setInput(e.target.value); setOutput(""); setStatus("idle"); setError(null); }}
            spellCheck={false}
            placeholder={inputPlaceholder}
            className={`focus-ring min-h-72 w-full resize-y rounded-xl border bg-card p-4 font-mono text-[13px] leading-relaxed placeholder:text-muted-foreground scrollbar-thin ${status === "invalid" ? "border-destructive/60" : ""}`}
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor={`ct-${slug}-output`} className="text-[13px] font-medium text-foreground">
              {validateOnly ? "Formatted preview" : "Output"}
            </label>
            {output && (
              <Button variant="ghost" size="sm" onClick={() => void copyText(output).then(() => toast.success("Copied"))}>
                <Copy size={13} className="mr-1" /> Copy
              </Button>
            )}
          </div>
          <output
            id={`ct-${slug}-output`}
            className="block min-h-72 w-full overflow-auto rounded-xl border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed whitespace-pre scrollbar-thin"
            aria-live="polite"
          >
            {output || <span className="text-muted-foreground">Result appears here…</span>}
          </output>
          {mode === "minify" && output && charSaved > 0 && (
            <p className="mt-1.5 text-xs text-success">
              <Minimize2 size={12} className="mr-1 inline" />
              Saved {charSaved.toLocaleString()} characters ({Math.round((charSaved / input.length) * 100)}% smaller)
            </p>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {quickActions}
        <Button
          onClick={() => void run()}
          disabled={!input.trim() || status === "busy"}
          className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {runLabel}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------- pure transform helpers ------------------------ */

export function formatXml(xml: string): string {
  let formatted = "";
  let indent = 0;
  const parts = xml.replace(/>\s*</g, "><").split(/(?=<)|(?<=>)/g).filter(Boolean);
  for (const part of parts) {
    if (/^<\/.+>$/.test(part) || /^-->$/.test(part)) indent = Math.max(0, indent - 1);
    formatted += "  ".repeat(indent) + part.trim() + "\n";
    if (/^<[a-zA-Z][^>]*>$/.test(part) && !/\/>$/.test(part)) indent++;
  }
  return formatted.trim();
}

export function validateXmlString(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const errNode = doc.querySelector("parsererror");
  if (errNode) {
    const detail = errNode.textContent?.match(/Line Number (\d+), Column (\d+)/);
    throw new Error(
      detail
        ? `Malformed XML at line ${detail[1]}, column ${detail[2]}: ${(errNode.textContent ?? "").split("\n")[0]}`
        : `Malformed XML: ${(errNode.textContent ?? "").slice(0, 160)}`,
    );
  }
  return "ok";
}

export function minifyXml(xml: string): string {
  return xml
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .trim();
}

export function formatCss(css: string): string {
  let out = "";
  let indent = 0;
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, (m) => `\u0000${btoa(unescape(encodeURIComponent(m)))}\u0000`);
  for (const ch of cleaned) {
    if (ch === "{") {
      out = out.trimEnd() + " {\n" + "  ".repeat(++indent);
    } else if (ch === "}") {
      out = out.trimEnd() + "\n" + "  ".repeat(--indent) + "}\n" + "  ".repeat(indent);
    } else if (ch === ";") {
      out += ";\n" + "  ".repeat(indent);
    } else if (ch === "\n") {
      // collapse
    } else {
      out += ch;
    }
  }
  return out
    .replace(/\n\s*\n/g, "\n")
    .replace(/}\n\s*/g, "}\n\n")
    .replace(/\u0000([A-Za-z0-9+/=]+)\u0000/g, (_, b64) => decodeURIComponent(escape(atob(b64))))
    .trim();
}

export function minifyCss(css: string): string {
  const preserved: string[] = [];
  let working = css.replace(/\/\*[\s\S]*?\*\//g, "");
  working = working.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, (m) => {
    preserved.push(m);
    return `"§${preserved.length - 1}§"`;
  });
  working = working
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
  return working.replace(/"§(\d+)§"/g, (_, i) => preserved[parseInt(i, 10)]);
}

export function minifyHtml(html: string): string {
  const preserved: string[] = [];
  let working = html.replace(/<(script|style|pre|textarea)\b[\s\S]*?<\/\1>/gi, (m) => {
    preserved.push(m);
    return `\u0000${preserved.length - 1}\u0000`;
  });
  working = working
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();
  return working.replace(/\u0000(\d+)\u0000/g, (_, i) => preserved[parseInt(i, 10)]);
}

export function minifySql(sql: string): string {
  // Protect string literals first so comment strippers can't eat them
  const literals: string[] = [];
  let working = sql.replace(/'(?:[^'\\]|\\.)*'/g, (m) => {
    literals.push(m);
    return `'\u0001${literals.length - 1}\u0001'`;
  });
  working = working
    .replace(/--[^\n]*/g, "")
    .replace(/\/[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .trim();
  return working.replace(/'\u0001(\d+)\u0001'/g, (_, i) => literals[parseInt(i, 10)]);
}

export async function formatWithPrettier(source: string, parser: string, plugins: unknown[], tabWidth = 2): Promise<string> {
  const prettier = await import("prettier/standalone");
  return await prettier.format(source, {
    parser,
    plugins: plugins as never,
    tabWidth,
    printWidth: 100,
    semi: true,
    singleQuote: false,
  });
}

export async function prettierPlugins(): Promise<unknown[]> {
  const [babel, estree, html, postcss, markdown] = await Promise.all([
    import("prettier/plugins/babel"),
    import("prettier/plugins/estree"),
    import("prettier/plugins/html"),
    import("prettier/plugins/postcss"),
    import("prettier/plugins/markdown"),
  ]);
  return [babel, estree, html, postcss, markdown];
}
