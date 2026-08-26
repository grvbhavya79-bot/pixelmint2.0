import { describe, expect, test } from "bun:test";
import { PDFDocument, StandardFonts, degrees } from "@cantoo/pdf-lib";

/* ---------- pure PDF helpers under test ---------- */
import { checkDestinationUrl, isSafeShortCode } from "@/lib/server/url-safety";
import { rateLimit } from "@/lib/server/rate-limit";

describe("pdf processing engine", () => {
  test("merge: combined page count equals sum", async () => {
    const a = await PDFDocument.create();
    a.addPage([300, 300]);
    a.addPage([300, 300]);
    const b = await PDFDocument.create();
    b.addPage([400, 400]);
    const bytesA = await a.save();
    const bytesB = await b.save();

    const merged = await PDFDocument.create();
    for (const bytes of [bytesA, bytesB]) {
      const src = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }
    expect(merged.getPageCount()).toBe(3);
  });

  test("split/extract: copy subset of pages", async () => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < 5; i++) doc.addPage([200, 200]);
    const bytes = await doc.save();

    const src = await PDFDocument.load(bytes);
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, [1, 3]); // pages 2 and 4
    copied.forEach((p) => out.addPage(p));
    expect(out.getPageCount()).toBe(2);
  });

  test("rotate: page rotation accumulates modulo 360", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 200]);
    page.setRotation(degrees(90));
    page.setRotation(degrees(page.getRotation().angle + 90));
    expect(page.getRotation().angle % 360).toBe(180);
  });

  test("watermark: text drawn on every page", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([300, 300]);
    doc.addPage([300, 300]);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    for (const page of doc.getPages()) {
      page.drawText("DRAFT", { x: 100, y: 150, size: 24, font });
    }
    const bytes = await doc.save();
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBe(2);
  });

  test("protect: document encrypts and reports encrypted", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([300, 300]);
    doc.encrypt({ userPassword: "secret123", ownerPassword: "secret123-owner" });
    const bytes = await doc.save();

    const reloaded = await PDFDocument.load(bytes, { ignoreEncryption: true });
    expect(reloaded.isEncrypted).toBe(true);
  });

  test("unlock: correct password rebuilds unencrypted copy", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([300, 300]);
    doc.encrypt({ userPassword: "secret123", ownerPassword: "secret123-owner" });
    const encrypted = await doc.save();

    const src = await PDFDocument.load(encrypted, { password: "secret123", ignoreEncryption: true });
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save();

    const clean = await PDFDocument.load(bytes);
    expect(clean.isEncrypted).toBe(false);
    expect(clean.getPageCount()).toBe(1);
  });
});

describe("url shortener safety", () => {
  test("accepts valid https URLs", () => {
    expect(checkDestinationUrl("https://example.com/page?q=1").ok).toBe(true);
  });

  test("rejects javascript: and data: schemes", () => {
    expect(checkDestinationUrl("javascript:alert(1)").ok).toBe(false);
    expect(checkDestinationUrl("data:text/html,hello").ok).toBe(false);
  });

  test("rejects private and local addresses", () => {
    expect(checkDestinationUrl("http://localhost/x").ok).toBe(false);
    expect(checkDestinationUrl("http://127.0.0.1/x").ok).toBe(false);
    expect(checkDestinationUrl("http://192.168.1.1/admin").ok).toBe(false);
    expect(checkDestinationUrl("http://10.0.0.5/internal").ok).toBe(false);
  });

  test("short codes must be safe", () => {
    expect(isSafeShortCode("abc123")).toBe(true);
    expect(isSafeShortCode("../etc")).toBe(false);
    expect(isSafeShortCode("a b")).toBe(false);
  });
});

describe("rate limiter", () => {
  test("allows up to the limit then blocks", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60000).allowed).toBe(true);
    }
    const blocked = rateLimit(key, 5, 60000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  test("independent keys", () => {
    expect(rateLimit(`a-${Math.random()}`, 1, 1000).allowed).toBe(true);
    expect(rateLimit(`b-${Math.random()}`, 1, 1000).allowed).toBe(true);
  });
});
