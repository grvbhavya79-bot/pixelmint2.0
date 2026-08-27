"use client";

import { lazy, type ComponentType } from "react";

/**
 * Central map: registry component key → lazy-loaded tool implementation.
 * Each entry is code-split so the homepage never loads tool processors.
 */
 
type ToolComponent = ComponentType<any>;

export const TOOL_COMPONENTS: Record<string, ToolComponent> = {
  // PDF
  PdfMergeTool: lazy(() => import("@/components/tools/pdf/pdf-merge-tool")),
  PdfSplitTool: lazy(() => import("@/components/tools/pdf/pdf-split-tool")),
  PdfCompressTool: lazy(() => import("@/components/tools/pdf/pdf-compress-tool")),
  PdfToImageTool: lazy(() => import("@/components/tools/pdf/pdf-to-image-tool")),
  ImagesToPdfTool: lazy(() => import("@/components/tools/pdf/images-to-pdf-tool")),
  PdfToWordTool: lazy(() => import("@/components/tools/pdf/pdf-to-word-tool")),
  WordToPdfTool: lazy(() => import("@/components/tools/pdf/word-to-pdf-tool")),
  PdfToExcelTool: lazy(() => import("@/components/tools/pdf/pdf-to-excel-tool")),
  ExcelToPdfTool: lazy(() => import("@/components/tools/pdf/excel-to-pdf-tool")),
  PdfToPptTool: lazy(() => import("@/components/tools/pdf/pdf-to-ppt-tool")),
  PptToPdfTool: lazy(() => import("@/components/tools/pdf/ppt-to-pdf-tool")),
  PdfRotateTool: lazy(() => import("@/components/tools/pdf/pdf-rotate-tool")),
  PdfPagesTool: lazy(() => import("@/components/tools/pdf/pdf-pages-tool")),
  PdfWatermarkTool: lazy(() => import("@/components/tools/pdf/pdf-watermark-tool")),
  PdfPageNumbersTool: lazy(() => import("@/components/tools/pdf/pdf-page-numbers-tool")),
  PdfProtectTool: lazy(() => import("@/components/tools/pdf/pdf-protect-tool")),
  PdfUnlockTool: lazy(() => import("@/components/tools/pdf/pdf-unlock-tool")),
  PdfMetadataTool: lazy(() => import("@/components/tools/pdf/pdf-metadata-tool")),
  PdfRepairTool: lazy(() => import("@/components/tools/pdf/pdf-repair-tool")),
  PdfOcrTool: lazy(() => import("@/components/tools/pdf/pdf-ocr-tool")),
  PdfSignTool: lazy(() => import("@/components/tools/pdf/pdf-sign-tool")),

  // Image
  ImageCompressTool: lazy(() => import("@/components/tools/image/image-compress-tool")),
  ImageResizeTool: lazy(() => import("@/components/tools/image/image-resize-tool")),
  ImageCropTool: lazy(() => import("@/components/tools/image/image-crop-tool")),
  ImageRotateFlipTool: lazy(() => import("@/components/tools/image/image-rotate-flip-tool")),
  ImageConvertTool: lazy(() => import("@/components/tools/image/image-convert-tool")),
  BgRemoverTool: lazy(() => import("@/components/tools/image/bg-remover-tool")),
  ImageBlurSharpenTool: lazy(() => import("@/components/tools/image/image-blur-sharpen-tool")),
  ImageFiltersTool: lazy(() => import("@/components/tools/image/image-filters-tool")),
  ImageMetadataTool: lazy(() => import("@/components/tools/image/image-metadata-tool")),
  FaviconTool: lazy(() => import("@/components/tools/image/favicon-tool")),

  // Document & text
  WordCounterTool: lazy(() => import("@/components/tools/document/word-counter-tool")),
  CaseConverterTool: lazy(() => import("@/components/tools/document/case-converter-tool")),
  LineToolsTool: lazy(() => import("@/components/tools/document/line-tools-tool")),
  TextToPdfTool: lazy(() => import("@/components/tools/document/text-to-pdf-tool")),
  TextToDocxTool: lazy(() => import("@/components/tools/document/text-to-docx-tool")),
  MarkdownToHtmlTool: lazy(() => import("@/components/tools/document/markdown-to-html-tool")),
  HtmlToPdfTool: lazy(() => import("@/components/tools/document/html-to-pdf-tool")),

  // File
  ZipTool: lazy(() => import("@/components/tools/file/zip-tool")),
  FileCompressTool: lazy(() => import("@/components/tools/file/file-compress-tool")),
  BatchRenameTool: lazy(() => import("@/components/tools/file/batch-rename-tool")),
  FileInspectorTool: lazy(() => import("@/components/tools/file/file-inspector-tool")),
  Base64Tool: lazy(() => import("@/components/tools/file/base64-tool")),
  QrGeneratorTool: lazy(() => import("@/components/tools/file/qr-generator-tool")),

  // Developer
  JsonTool: lazy(() => import("@/components/tools/developer/json-tool")),
  XmlTool: lazy(() => import("@/components/tools/developer/xml-tool")),
  HtmlTool: lazy(() => import("@/components/tools/developer/html-tool")),
  CssTool: lazy(() => import("@/components/tools/developer/css-tool")),
  JsTool: lazy(() => import("@/components/tools/developer/js-tool")),
  SqlTool: lazy(() => import("@/components/tools/developer/sql-tool")),
  RegexTesterTool: lazy(() => import("@/components/tools/developer/regex-tester-tool")),
  UuidTool: lazy(() => import("@/components/tools/developer/uuid-tool")),

  // Generators
  PasswordGeneratorTool: lazy(() => import("@/components/tools/generators/password-generator-tool")),
  RandomNumberTool: lazy(() => import("@/components/tools/generators/random-number-tool")),
  LoremTool: lazy(() => import("@/components/tools/generators/lorem-tool")),
  QrReaderTool: lazy(() => import("@/components/tools/generators/qr-reader-tool")),
  ColorPickerTool: lazy(() => import("@/components/tools/generators/color-picker-tool")),
  ColorConverterTool: lazy(() => import("@/components/tools/generators/color-converter-tool")),
  UnixTimestampTool: lazy(() => import("@/components/tools/generators/unix-timestamp-tool")),
  UrlCodecTool: lazy(() => import("@/components/tools/generators/url-codec-tool")),
  HtmlEntityTool: lazy(() => import("@/components/tools/generators/html-entity-tool")),
  UrlShortenerTool: lazy(() => import("@/components/tools/generators/url-shortener-tool")),

  // AI
  AiTool: lazy(() => import("@/components/tools/generators/ai-tool")),

  // Calculators
  PercentageCalc: lazy(() => import("@/components/tools/calculators/percentage-calc")),
  AgeCalc: lazy(() => import("@/components/tools/calculators/age-calc")),
  BmiCalc: lazy(() => import("@/components/tools/calculators/bmi-calc")),
  EmiCalc: lazy(() => import("@/components/tools/calculators/emi-calc")),
  GstCalc: lazy(() => import("@/components/tools/calculators/gst-calc")),
  DiscountCalc: lazy(() => import("@/components/tools/calculators/discount-calc")),
  TimeCalc: lazy(() => import("@/components/tools/calculators/time-calc")),
  DateDiffCalc: lazy(() => import("@/components/tools/calculators/date-diff-calc")),
  UnitConverter: lazy(() => import("@/components/tools/calculators/unit-converter")),
  CurrencyConverter: lazy(() => import("@/components/tools/calculators/currency-converter")),
};
