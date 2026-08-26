"use client";

import { useState } from "react";
import { CodeToolShell, minifySql } from "./code-tool-shell";
import { OptionSelect } from "@/components/tools/shared/option-controls";

const DIALECTS = [
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL / MariaDB" },
  { value: "sqlite", label: "SQLite" },
  { value: "transactsql", label: "T-SQL (SQL Server)" },
  { value: "plsql", label: "PL/SQL (Oracle)" },
  { value: "redshift", label: "Amazon Redshift" },
  { value: "bigquery", label: "Google BigQuery" },
];

export default function SqlTool({ mode = "format" }: { mode?: string }) {
  const [dialect, setDialect] = useState("postgresql");
  const isFormat = mode === "format";

  return (
    <CodeToolShell
      slug={isFormat ? "sql-formatter" : "sql-minifier"}
      mode={isFormat ? "format" : "minify"}
      inputPlaceholder={"select u.id, u.name, count(o.id) as orders from users u left join orders o on o.user_id = u.id where u.active = 1 group by u.id, u.name order by orders desc"}
      runLabel={isFormat ? "Format SQL" : "Minify SQL"}
      transform={async (input) => {
        if (!isFormat) return minifySql(input);
        const { format } = await import("sql-formatter");
        try {
          return format(input, { language: dialect as never, tabWidth: 2, keywordCase: "upper" });
        } catch {
          throw new Error("This SQL could not be parsed. Check the statement syntax and try a different dialect.");
        }
      }}
      quickActions={
        isFormat ? (
          <div className="w-52">
            <OptionSelect label="Dialect" value={dialect} onValueChange={setDialect} options={DIALECTS} id="sql-dialect" />
          </div>
        ) : undefined
      }
    />
  );
}
