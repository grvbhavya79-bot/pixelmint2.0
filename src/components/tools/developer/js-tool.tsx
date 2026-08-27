"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CodeToolShell, formatWithPrettier, prettierPlugins } from "./code-tool-shell";
import { OptionSwitch } from "@/components/tools/shared/option-controls";

export default function JsTool({ mode = "minify" }: { mode?: string }) {
  const [mangle, setMangle] = useState(true);
  const [dropConsole, setDropConsole] = useState(false);
  const isMinify = mode === "minify";

  return (
    <CodeToolShell
      slug={isMinify ? "javascript-minifier" : "javascript-formatter"}
      mode={isMinify ? "minify" : "format"}
      inputPlaceholder={"function greet(name){const msg=`Hello, ${name}!`;return msg;}\nconsole.log(greet('world'));"}
      runLabel={isMinify ? "Minify JavaScript" : "Format JavaScript"}
      transform={async (input) => {
        if (!isMinify) {
          const plugins = await prettierPlugins();
          return formatWithPrettier(input, "babel", plugins);
        }
        const { minify } = await import("terser");
        const result = await minify(input, {
          mangle,
          compress: { drop_console: dropConsole },
          format: { comments: false },
          module: false,
        });
        if (!result.code) throw new Error("This script could not be minified — check for syntax errors.");
        return result.code;
      }}
      quickActions={
        isMinify ? (
          <div className="flex flex-wrap items-center gap-4">
            <OptionSwitch label="Mangle variable names" checked={mangle} onCheckedChange={setMangle} id="js-mangle" />
            <OptionSwitch label="Drop console.*" checked={dropConsole} onCheckedChange={setDropConsole} id="js-console" />
            <button
              type="button"
              className="focus-ring text-xs font-medium text-primary hover:underline"
              onClick={() => toast.info("Powered by Terser — the same engine behind many production build tools.")}
            >
              About the engine
            </button>
          </div>
        ) : undefined
      }
    />
  );
}
