# ToolBox100

**100 Powerful Tools. One Simple Workspace.**

A complete, production-ready online tools platform: 100 fully implemented utilities for PDFs,
images, documents, files, developers and daily calculations — free, no sign-up, and privacy-first.

> Owner: Grv Bhavya · Madhubani, Bihar, India · grvbhavya79@gmail.com

---

## Highlights

- **100 working tools, zero placeholders** — every listed tool is fully implemented and tested.
- **Privacy-first architecture** — PDF, image, document, archive and developer tools run
  **entirely in the browser** (pdf-lib, pdf.js, canvas, fflate, Terser, Prettier, Tesseract).
  Files never leave the user's device; there is no upload endpoint for them at all.
- **Original design system** — custom brand, logo (SVG), tokens, light/dark/system themes.
- **Central tool registry** — one data-driven registry powers cards, search, categories,
  SEO metadata, JSON-LD, FAQs, related tools and code-split lazy loading.
- **Server-side where it matters** — URL shortener with click tracking, contact form with
  email delivery, live currency rates, anonymous usage analytics, admin dashboard.
- **Security** — content-based file validation (magic bytes), rate limiting, URL safety checks,
  path-traversal-safe ZIP extraction, HMAC-signed admin sessions, security headers.
- **SEO** — unique metadata for all 100 tools, canonical URLs, Open Graph, Twitter cards,
  JSON-LD (SoftwareApplication + FAQPage + HowTo), sitemap.xml, robots.txt.
- **PWA** — manifest, generated icon set, conservative service worker for offline static assets.
- **Accessibility** — semantic HTML, ARIA, keyboard navigation, focus rings, reduced-motion support.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Client processing | @cantoo/pdf-lib, pdfjs-dist, canvas, fflate, Terser, Prettier, sql-formatter, Tesseract.js, jsQR, qrcode |
| Documents | docx, exceljs, pptxgenjs, mammoth, marked + DOMPurify |
| Database | Prisma ORM (SQLite in dev; PostgreSQL/Supabase in production) |
| Analytics | Self-hosted anonymous usage counters (no third-party trackers) |

## Getting started

```bash
bun install          # install dependencies
bun run db:push      # create the SQLite database
bun run dev          # start the dev server on :3000
```

Then open <http://localhost:3000>.

### Admin dashboard

Visit `/admin` and sign in with the `ADMIN_PASSWORD` environment variable
(default for development: `admin123` — **change it before deploying**).
The dashboard shows total/daily/weekly/monthly usage, failed processes, popular tools,
daily traffic and category charts, the URL-shortener manager (search, disable, delete)
and the contact inbox.

### Tests

```bash
bun test            # 82 tests: registry integrity (100 tools), calculators,
                    # text/color/unit logic, PDF engine (merge/split/rotate/protect/unlock),
                    # URL safety, rate limiting, minifiers/formatters
```

### Other scripts

```bash
bun run lint                    # ESLint (clean)
bunx tsc --noEmit               # strict TypeScript (clean for src/)
bun scripts/generate-icons.ts   # regenerate PWA icons from the brand SVG
bun scripts/check-icons.ts      # verify every registry icon exists in lucide
```

## Production notes

1. Copy `.env.example` → `.env` and fill in real values (`NEXT_PUBLIC_SITE_URL`, database,
   `ADMIN_PASSWORD`, optional Supabase / storage / email / currency keys).
2. For PostgreSQL, change the `datasource` provider in `prisma/schema.prisma` and run
   `bun run db:push`.
3. `bun run build && bun start` produces a standalone production server.
4. Email delivery for the contact form uses a Resend-compatible API when `EMAIL_API_KEY`
   is set; messages are always stored and visible in the admin inbox either way.

## Architecture map

```
src/
  app/                    # routes: /, /tools/[slug], /categories/[category], /popular,
                          # /favorites, /about, /contact, /privacy, /terms, /admin, /s/[code]
  app/api/                # track · contact · currency · shortener · admin (login/analytics/urls/messages)
  components/tools/       # tool page system + 72 lazy-loaded tool implementations
  components/layout/      # header, footer, search palette, theme, logo
  lib/tools/              # THE registry: 100 tool definitions + categories + search + FAQs
  lib/processors-like/    # pdf/client.ts, imaging.ts, office/render-pdf.ts, exif.ts
  lib/                    # calc, text-tools, color, units, format, download, track, validators
  lib/server/             # rate-limit, admin-auth, url-safety, currency (live rates + cache)
  hooks/                  # favorites & recents (localStorage via useSyncExternalStore)
tests/                    # bun test suites (82 tests)
scripts/                  # icon generation, icon verification
prisma/                   # schema: ToolUsage, ShortUrl, ShortUrlClick, ContactMessage, SystemSetting
public/                   # PWA icons, sw.js, pdf.worker
```

## Tool catalog (100)

| Category | Count | Examples |
|---|---|---|
| PDF Tools | 25 | Merge, Split, Compress, PDF↔Word/Excel/PowerPoint, Watermark, Sign, OCR, Protect, Unlock, Repair |
| Image Tools | 20 | Compress, Resize, Crop, Rotate/Flip, 8 converters, Background Remover, Filters, Favicon Generator |
| Document & Text | 10 | Word/Character Counter, Case Converter, Line Tools, Text→PDF/DOCX, Markdown→HTML, HTML→PDF |
| File Tools | 10 | ZIP Creator/Extractor, File Compressor, Batch Renamer, Inspectors, Base64, QR Generator |
| Developer Tools | 15 | JSON/XML/HTML/CSS/JS/SQL format+minify, Regex Tester, UUID Generator |
| Generators & Utilities | 10 | Password, Random, Lorem, QR Reader, Color Picker/Converter, Timestamp, URL/HTML codec, URL Shortener |
| Calculators | 10 | Percentage, Age, BMI, EMI, GST, Discount, Time, Date Difference, Units, Currency (live) |
