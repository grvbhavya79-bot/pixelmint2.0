import { describe, expect, test } from "bun:test";
import {
  toCase, removeDuplicateLines, sortLines, cleanSpaces, analyzeText, generatePassword, passwordStrengthBits, randomIntegers,
} from "@/lib/text-tools";
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, isValidHex, contrastRatio } from "@/lib/color";
import { convertUnit, convertTemperature, formatConversion } from "@/lib/units";
import { formatBytes, savedPercent, sanitizeWinAnsi, safeBaseName, stripExtension } from "@/lib/format";
import { parsePageRanges, parsePageGroups } from "@/lib/pdf/client";
import { minifyCss, minifyXml, formatXml, minifyHtml, minifySql } from "@/components/tools/developer/code-tool-shell";

describe("case converter", () => {
  test("all seven required styles", () => {
    expect(toCase("hello world", "upper")).toBe("HELLO WORLD");
    expect(toCase("HELLO World", "lower")).toBe("hello world");
    expect(toCase("hello world again", "title")).toBe("Hello World Again");
    expect(toCase("hello WORLD. second SENTENCE", "sentence")).toBe("Hello world. Second sentence");
    expect(toCase("hello world", "camel")).toBe("helloWorld");
    expect(toCase("hello world", "snake")).toBe("hello_world");
    expect(toCase("hello world", "kebab")).toBe("hello-world");
  });

  test("mixed delimiter inputs", () => {
    expect(toCase("Hello-World_test", "snake")).toBe("hello_world_test");
    expect(toCase("helloWorld", "kebab")).toBe("hello-world");
  });
});

describe("line tools", () => {
  test("remove duplicates preserves order", () => {
    const { result, removed } = removeDuplicateLines("a\nb\na\nc\nb");
    expect(result).toBe("a\nb\nc");
    expect(removed).toBe(2);
  });

  test("dedupe ignores case when asked", () => {
    const { result } = removeDuplicateLines("Apple\napple\nBanana", { ignoreCase: true });
    expect(result).toBe("Apple\nBanana");
  });

  test("sort A-Z and numeric", () => {
    expect(sortLines("banana\napple\ncherry", "az")).toBe("apple\nbanana\ncherry");
    expect(sortLines("banana\napple\ncherry", "za")).toBe("cherry\nbanana\napple");
    expect(sortLines("10\n2\n1", "numeric-asc")).toBe("1\n2\n10");
    expect(sortLines("1\n2\n10", "numeric-desc")).toBe("10\n2\n1");
  });

  test("clean spaces", () => {
    expect(cleanSpaces("hello   world", { collapseSpaces: true })).toBe("hello world");
    expect(cleanSpaces("  padded  ", { trimLines: true })).toBe("padded");
    expect(cleanSpaces("a\n\n\nb", { removeEmptyLines: true })).toBe("a\nb");
  });
});

describe("word counter", () => {
  test("counts words, characters, sentences, paragraphs", () => {
    const stats = analyzeText("Hello world.\n\nThis is a test sentence. And another!");
    expect(stats.words).toBe(9);
    expect(stats.paragraphs).toBe(2);
    expect(stats.sentences).toBe(3);
    expect(stats.charactersNoSpaces).toBe("Helloworld.Thisisatestsentence.Andanother!".length);
  });

  test("empty text", () => {
    const stats = analyzeText("");
    expect(stats.words).toBe(0);
    expect(stats.sentences).toBe(0);
  });
});

describe("password generator", () => {
  test("respects length and required charsets", () => {
    const pw = generatePassword({ length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true });
    expect(pw.length).toBe(20);
    expect(pw).toMatch(/[a-z]/);
    expect(pw).toMatch(/[A-Z]/);
    expect(pw).toMatch(/\d/);
    expect(pw).toMatch(/[^a-zA-Z0-9]/);
  });

  test("custom random source is deterministic", () => {
    const fake = () => 0.42;
    const a = generatePassword({ length: 12, uppercase: false, lowercase: true, numbers: false, symbols: false }, fake);
    const b = generatePassword({ length: 12, uppercase: false, lowercase: true, numbers: false, symbols: false }, fake);
    expect(a).toBe(b);
  });

  test("strength grows with length", () => {
    const short = passwordStrengthBits("abc12");
    const long = passwordStrengthBits("abcdefghij1234567890!@#$");
    expect(long.bits).toBeGreaterThan(short.bits);
  });

  test("random integers in range and unique", () => {
    const nums = randomIntegers(1, 10, 5, true);
    expect(nums.length).toBe(5);
    expect(new Set(nums).size).toBe(5);
    expect(Math.max(...nums)).toBeLessThanOrEqual(10);
  });
});

describe("color utilities", () => {
  test("hex ↔ rgb roundtrip", () => {
    expect(hexToRgb("#2563EB")).toEqual({ r: 37, g: 99, b: 235 });
    expect(rgbToHex({ r: 37, g: 99, b: 235 })).toBe("#2563EB");
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  test("rgb → hsl", () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, l: 50 });
  });

  test("hsl → rgb", () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
  });

  test("validation", () => {
    expect(isValidHex("#abc")).toBe(true);
    expect(isValidHex("#AABBCC")).toBe(true);
    expect(isValidHex("nope")).toBe(false);
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });
});

describe("unit converter", () => {
  test("length conversions", () => {
    expect(convertUnit(100, "cm", "m", "length")).toBe(1);
    expect(convertUnit(1, "mi", "km", "length")).toBeCloseTo(1.609344, 4);
    expect(convertUnit(12, "in", "ft", "length")).toBeCloseTo(1, 9);
  });

  test("weight conversions", () => {
    expect(convertUnit(1000, "g", "kg", "weight")).toBe(1);
    expect(convertUnit(1, "kg", "lb", "weight")).toBeCloseTo(2.20462, 3);
  });

  test("temperature formulas", () => {
    expect(convertTemperature(100, "C", "F")).toBeCloseTo(212);
    expect(convertTemperature(32, "F", "C")).toBeCloseTo(0);
    expect(convertTemperature(0, "C", "K")).toBeCloseTo(273.15);
  });

  test("data units distinguish SI and binary", () => {
    expect(convertUnit(1, "KB", "B", "data")).toBe(1000);
    expect(convertUnit(1, "KiB", "B", "data")).toBe(1024);
    expect(convertUnit(1, "GiB", "MiB", "data")).toBe(1024);
  });

  test("formatting", () => {
    expect(formatConversion(1000)).toBe("1,000");
    expect(formatConversion(0.0000001)).toContain("e-");
  });
});

describe("format helpers", () => {
  test("formatBytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  test("savedPercent", () => {
    expect(savedPercent(100, 25)).toBe("75.0%");
    expect(savedPercent(8.4 * 1024 * 1024, 2.2 * 1024 * 1024)).toBe("73.8%");
  });

  test("sanitizeWinAnsi replaces typographic chars", () => {
    expect(sanitizeWinAnsi("“quoted” — dash…")).toBe('"quoted" - dash...');
  });

  test("safeBaseName strips path characters", () => {
    expect(safeBaseName("../../etc/passwd")).toBe("etcpasswd");
    expect(safeBaseName("my<file>:name?.pdf")).toBe("myfilename.pdf");
  });

  test("stripExtension", () => {
    expect(stripExtension("report.pdf")).toBe("report");
    expect(stripExtension("noext")).toBe("noext");
    expect(stripExtension("archive.tar.gz")).toBe("archive.tar");
  });
});

describe("pdf page range parsing", () => {
  test("parses mixed ranges", () => {
    expect(parsePageRanges("1-3, 5, 8-10", 20)).toEqual([1, 2, 3, 5, 8, 9, 10]);
  });

  test("clamps to page count", () => {
    expect(parsePageRanges("5-100", 7)).toEqual([5, 6, 7]);
  });

  test("ignores invalid tokens", () => {
    expect(parsePageRanges("2, x, 4-", 10)).toEqual([2]);
  });

  test("groups for split", () => {
    expect(parsePageGroups("1-3, 5", 10)).toEqual([[1, 2, 3], [5]]);
  });
});

describe("code minifiers/formatters", () => {
  test("css minifier protects strings", () => {
    const css = '.a { color: red; /* comment */ background: url("my image.png") }';
    const min = minifyCss(css);
    expect(min).not.toContain("comment");
    expect(min).toContain('"my image.png"');
    expect(min).not.toContain(": ");
  });

  test("xml formatter indents", () => {
    const formatted = formatXml("<a><b>text</b></a>");
    expect(formatted).toContain("\n");
    expect(formatted).toContain("  ");
  });

  test("xml minifier collapses", () => {
    expect(minifyXml("<a>\n  <b>x</b>\n</a>")).toBe("<a><b>x</b></a>");
  });

  test("html minifier protects pre blocks", () => {
    const html = "<div>  spaced  </div><pre>  keep\n  me  </pre><!-- drop -->";
    const min = minifyHtml(html);
    expect(min).toContain("<div>spaced</div>");
    expect(min).toContain("<pre>  keep\n  me  </pre>");
    expect(min).not.toContain("drop");
  });

  test("sql minifier removes line comments but not strings", () => {
    const sql = "SELECT a -- find a\nFROM t WHERE x = 'has -- dashes'";
    const min = minifySql(sql);
    expect(min).toBe("SELECT a FROM t WHERE x = 'has -- dashes'");
  });
});
