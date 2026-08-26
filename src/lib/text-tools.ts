/**
 * Pure text tool logic — shared by text tools and unit tests.
 */

/* ------------------------------ Case conversion --------------------------- */

export type CaseStyle =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "alternating";

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "the", "to", "up", "via"]);

function words(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_\-.]+/)
    .filter(Boolean);
}

export function toCase(text: string, style: CaseStyle): string {
  switch (style) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title": {
      const result = text.toLowerCase().split(/\s+/);
      return result
        .map((w, i) => {
          if (i > 0 && i < result.length - 1 && SMALL_WORDS.has(w)) return w;
          return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(" ");
    }
    case "sentence":
      return text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    case "camel":
      return words(text)
        .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
        .join("");
    case "pascal":
      return words(text)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
    case "snake":
      return words(text).map((w) => w.toLowerCase()).join("_");
    case "kebab":
      return words(text).map((w) => w.toLowerCase()).join("-");
    case "constant":
      return words(text).map((w) => w.toUpperCase()).join("_");
    case "alternating":
      return text
        .split("")
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join("");
    default:
      return text;
  }
}

/* -------------------------------- Line tools ------------------------------- */

export function removeDuplicateLines(text: string, options: { ignoreCase?: boolean; trim?: boolean } = {}): { result: string; removed: number } {
  const lines = text.split("\n");
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const line of lines) {
    let key = options.trim ? line.trim() : line;
    if (options.ignoreCase) key = key.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      kept.push(line);
    }
  }
  return { result: kept.join("\n"), removed: lines.length - kept.length };
}

export type SortMode = "az" | "za" | "numeric-asc" | "numeric-desc" | "length-asc" | "length-desc";

export function sortLines(text: string, mode: SortMode, options: { caseInsensitive?: boolean; unique?: boolean } = {}): string {
  let lines = text.split("\n");
  if (options.unique) lines = [...new Set(lines)];
  const collator = new Intl.Collator("en", { sensitivity: options.caseInsensitive ? "base" : "variant", numeric: true });
  switch (mode) {
    case "az":
      return lines.sort((a, b) => collator.compare(a, b)).join("\n");
    case "za":
      return lines.sort((a, b) => collator.compare(b, a)).join("\n");
    case "numeric-asc":
      return lines.sort((a, b) => leadingNumber(a) - leadingNumber(b)).join("\n");
    case "numeric-desc":
      return lines.sort((a, b) => leadingNumber(b) - leadingNumber(a)).join("\n");
    case "length-asc":
      return lines.sort((a, b) => a.length - b.length || collator.compare(a, b)).join("\n");
    case "length-desc":
      return lines.sort((a, b) => b.length - a.length || collator.compare(a, b)).join("\n");
  }
}

function leadingNumber(line: string): number {
  const m = line.trim().match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : Number.POSITIVE_INFINITY;
}

export interface SpaceCleanOptions {
  collapseSpaces?: boolean;
  trimLines?: boolean;
  removeEmptyLines?: boolean;
  removeTabs?: boolean;
}

export function cleanSpaces(text: string, opts: SpaceCleanOptions): string {
  let result = text;
  if (opts.removeTabs) result = result.replace(/\t/g, " ");
  if (opts.collapseSpaces) result = result.replace(/[ \t]{2,}/g, " ");
  let lines = result.split("\n");
  if (opts.trimLines) lines = lines.map((l) => l.replace(/^[ \t]+|[ \t]+$/g, ""));
  if (opts.removeEmptyLines) lines = lines.filter((l) => l.trim() !== "");
  return lines.join("\n");
}

/* -------------------------------- Word count ------------------------------- */

export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  averageWordLength: number;
  readingTimeMinutes: number;
  longestWord: string;
}

export function analyzeText(text: string): TextStats {
  const trimmed = text.trim();
  const wordList = trimmed ? trimmed.split(/\s+/) : [];
  const sentences = trimmed ? (trimmed.match(/[^.!?…]+[.!?…]+(\s|$)|[^.!?…]+$/g) ?? [trimmed]).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const longest = wordList.reduce((acc, w) => (w.length > acc.length ? w : acc), "");
  return {
    words: wordList.length,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    sentences,
    paragraphs,
    lines: text ? text.split("\n").length : 0,
    averageWordLength: wordList.length
      ? Math.round((wordList.join("").length / wordList.length) * 100) / 100
      : 0,
    readingTimeMinutes: Math.max(1, Math.round(wordList.length / 200)),
    longestWord: longest,
  };
}

/* -------------------------------- Lorem ipsum ------------------------------ */

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
  "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim",
  "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
  "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "eu", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat",
  "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim",
  "id", "est", "laborum", "curabitur", "pretium", "tincidunt", "lacus", "nulla", "gravida", "orci",
  "a", "odio", "nullam", "varius", "turpis", "commodo", "condimentum", "luctus", "nec", "ullamcorper",
  "mattis", "pulvinar", "dapibus", "leo", "vivamus", "elementum", "semper", "nisi", "aenean", "vulputate",
];

function randomWords(count: number, startWithLorem: boolean): string[] {
  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    if (startWithLorem && i < 2) {
      picked.push(i === 0 ? "lorem" : "ipsum");
      continue;
    }
    picked.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
  }
  return picked;
}

export function loremSentence(startWithLorem = false): string {
  const count = 8 + Math.floor(Math.random() * 10);
  const words = randomWords(count, startWithLorem);
  const s = words.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

export function loremParagraph(startWithLorem = false): string {
  const sentences = 4 + Math.floor(Math.random() * 4);
  return Array.from({ length: sentences }, (_, i) => loremSentence(startWithLorem && i === 0)).join(" ");
}

export function generateLorem(
  unit: "paragraphs" | "sentences" | "words",
  count: number,
  startWithLorem = true,
): string {
  switch (unit) {
    case "paragraphs":
      return Array.from({ length: count }, (_, i) => loremParagraph(startWithLorem && i === 0)).join("\n\n");
    case "sentences":
      return Array.from({ length: count }, (_, i) => loremSentence(startWithLorem && i === 0)).join(" ");
    case "words":
      return randomWords(count, startWithLorem).join(" ");
  }
}

/* ------------------------------ Password logic ----------------------------- */

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous?: boolean;
}

export const PASSWORD_CHARSETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?",
};

const AMBIGUOUS = "O0oIl1|`'\";:.,";

export function generatePassword(opts: PasswordOptions, random: (n: number) => number = insecureRandom): string {
  let pool = "";
  const required: string[] = [];
  if (opts.lowercase) {
    const set = filterAmbiguous(PASSWORD_CHARSETS.lowercase, opts.excludeAmbiguous);
    pool += set;
    required.push(pickFrom(set, random));
  }
  if (opts.uppercase) {
    const set = filterAmbiguous(PASSWORD_CHARSETS.uppercase, opts.excludeAmbiguous);
    pool += set;
    required.push(pickFrom(set, random));
  }
  if (opts.numbers) {
    const set = filterAmbiguous(PASSWORD_CHARSETS.numbers, opts.excludeAmbiguous);
    pool += set;
    required.push(pickFrom(set, random));
  }
  if (opts.symbols) {
    const set = filterAmbiguous(PASSWORD_CHARSETS.symbols, opts.excludeAmbiguous);
    pool += set;
    required.push(pickFrom(set, random));
  }
  if (!pool) return "";

  const length = Math.max(required.length, Math.min(128, Math.max(1, opts.length)));
  const chars = [...required];
  while (chars.length < length) chars.push(pool[Math.floor(random(pool.length)) % pool.length]);
  // Shuffle (Fisher-Yates with provided random)
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(random(i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function filterAmbiguous(set: string, exclude?: boolean): string {
  if (!exclude) return set;
  return [...set].filter((c) => !AMBIGUOUS.includes(c)).join("");
}

function pickFrom(set: string, random: (n: number) => number): string {
  return set[Math.floor(random(set.length)) % set.length];
}

function insecureRandom(n: number): number {
  return Math.random() * n;
}

export type PasswordStrength = "weak" | "fair" | "strong" | "very strong";

export function passwordStrengthBits(password: string): { bits: number; label: PasswordStrength; score: number } {
  if (!password) return { bits: 0, label: "weak", score: 0 };
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/\d/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;
  const bits = Math.round(password.length * Math.log2(poolSize || 1));
  const label: PasswordStrength = bits < 40 ? "weak" : bits < 65 ? "fair" : bits < 90 ? "strong" : "very strong";
  const score = Math.min(100, Math.round((bits / 128) * 100));
  return { bits, label, score };
}

/* ------------------------------ Random numbers ----------------------------- */

export function randomIntegers(min: number, max: number, count: number, unique: boolean): number[] {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  if (hi < lo) return [];
  if (unique) {
    const range = hi - lo + 1;
    if (count > range) count = range;
    const set = new Set<number>();
    while (set.size < count) set.add(lo + Math.floor(Math.random() * range));
    return [...set];
  }
  return Array.from({ length: count }, () => lo + Math.floor(Math.random() * (hi - lo + 1)));
}
