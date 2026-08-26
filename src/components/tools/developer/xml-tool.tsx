"use client";

import { CodeToolShell, formatXml, validateXmlString } from "./code-tool-shell";

export default function XmlTool({ mode = "format" }: { mode?: string }) {
  return (
    <CodeToolShell
      slug={mode === "format" ? "xml-formatter" : "xml-validator"}
      mode={mode === "validate" ? "validate" : "format"}
      inputPlaceholder={'<?xml version="1.0"?>\n<catalog><book id="1"><title>ToolBox100</title></book></catalog>'}
      runLabel={mode === "validate" ? "Validate XML" : "Format XML"}
      transform={(input) => {
        validateXmlString(input);
        return formatXml(input);
      }}
    />
  );
}
