export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string; toolSlug?: string; toolName?: string };

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  readingMinutes: number;
  category: string;
  tags: string[];
  /** Slugs of Pixelmint tools featured in this article */
  relatedTools: string[];
  content: BlogBlock[];
}

export const POSTS: BlogPost[] = [
  {
    slug: "how-to-merge-pdf-files-online-for-free",
    title: "How to Merge PDF Files Online for Free",
    description:
      "A step-by-step guide to combining multiple PDF files into one document online — free, private and without installing any software.",
    date: "2026-02-10",
    readingMinutes: 4,
    category: "PDF Guides",
    tags: ["pdf", "merge pdf", "combine pdf", "free tools"],
    relatedTools: ["merge-pdf", "split-pdf", "compress-pdf"],
    content: [
      { type: "p", text: "Combining several PDFs into a single tidy document is one of the most common file tasks there is — portfolios, invoices, scanned pages, contracts — and it shouldn't require paid software. With Pixelmint.fun's Merge PDF tool, the whole job takes under a minute and happens right in your browser." },
      { type: "h2", text: "Step 1: Open the Merge PDF tool" },
      { type: "p", text: "Go to the Merge PDF tool. You don't need an account, and there's nothing to install. The page works the same on Windows, Mac, Linux, Android and iOS — anything with a modern browser." },
      { type: "h2", text: "Step 2: Add your PDF files" },
      { type: "p", text: "Drag and drop your PDFs onto the upload area, or click it to pick files from your device. You can add as many PDFs as you need, and — importantly — you can reorder them: the tool shows your file list with simple move controls so the final document follows exactly the order you want." },
      { type: "callout", text: "Your files never leave your device with this tool — merging happens locally in your browser.", toolSlug: "merge-pdf", toolName: "Merge PDF" },
      { type: "h2", text: "Step 3: Merge and download" },
      { type: "p", text: "Press the Merge button. Within a couple of seconds you'll get a download for your combined PDF. Check the page count in the result panel to confirm everything made it in, then download. That's genuinely all there is to it." },
      { type: "h2", text: "Tips for cleaner merges" },
      {
        type: "list",
        items: [
          "Name your source files 01-, 02-, 03- before merging so the order is obvious at a glance.",
          "Rotate any sideways pages before merging so the final document reads consistently.",
          "Merged file too large to email? Run it through a PDF compressor afterwards — 10 MB attachments are a common ceiling.",
          "Need the opposite — one PDF split into many? The Split PDF tool extracts exactly the pages you want.",
        ],
      },
      { type: "p", text: "That's the Pixelmint approach in one task: open the tool, drop your files, get a clean result. No watermarks, no sign-ups, no 'upgrade to merge more than 2 files' nonsense." },
    ],
  },
  {
    slug: "how-to-compress-a-pdf-without-losing-quality",
    title: "How to Compress a PDF Without Losing Quality",
    description:
      "Learn how to shrink large PDF files for email and uploads while keeping text sharp and images readable — with a free online tool.",
    date: "2026-02-18",
    readingMinutes: 5,
    category: "PDF Guides",
    tags: ["pdf", "compress pdf", "reduce pdf size", "file size"],
    relatedTools: ["compress-pdf", "merge-pdf", "image-compressor"],
    content: [
      { type: "p", text: "A 40 MB PDF that refuses to attach to an email is a special kind of frustration. The good news: most PDFs carry far more weight than they need to — oversized embedded images, redundant fonts, unused objects — and a smart compressor can cut them down dramatically with no visible loss. Here's how to do it without paying for desktop software." },
      { type: "h2", text: "Why PDFs get so large" },
      {
        type: "list",
        items: [
          "Full-resolution photos embedded at print quality — often 5-10× bigger than needed for screen viewing.",
          "Scanned pages saved as uncompressed images rather than efficient compressed streams.",
          "Embedded fonts that include every glyph variant, even unused ones.",
          "Leftover objects from editing sessions — deleted pages and revisions can linger inside the file.",
        ],
      },
      { type: "h2", text: "Compressing with the PDF Compressor" },
      { type: "p", text: "Open the PDF Compressor, drop in your file, and pick a quality level. The tool rebuilds the document with optimized image streams and object streams — all locally in your browser, so sensitive documents never leave your machine. For most files, 'Balanced' quality cuts 50-70% of the size while keeping pages crisp." },
      { type: "callout", text: "Try the compressor on a scanned document — scans usually shrink the most.", toolSlug: "compress-pdf", toolName: "Compress PDF" },
      { type: "h2", text: "Choosing the right quality level" },
      { type: "p", text: "For documents that will be read on screens — reports, resumes, handouts — the balanced setting is almost always right. Use the strong compression option when you just need the file under a hard limit (like a 2 MB upload form) and the content is mostly text. Keep light compression for anything headed to a printer." },
      { type: "h2", text: "If it's still too large" },
      { type: "p", text: "Images are usually the remaining culprit. Convert heavy pages to JPG first and rebuild them into a PDF, or run individual images through the Image Compressor before creating your document. A PDF assembled from well-compressed images starts life small — no second pass needed." },
      { type: "p", text: "Compress first, send anywhere. It's a ten-second habit that saves hours of upload timeouts." },
    ],
  },
  {
    slug: "jpg-vs-png-which-image-format-should-you-use",
    title: "JPG vs PNG: Which Image Format Should You Use?",
    description:
      "A plain-English comparison of JPG and PNG — when each format wins, why converting between them matters, and how to choose.",
    date: "2026-02-25",
    readingMinutes: 5,
    category: "Image Guides",
    tags: ["images", "jpg", "png", "file formats", "conversion"],
    relatedTools: ["jpg-to-png", "png-to-jpg", "image-compressor", "webp-to-png"],
    content: [
      { type: "p", text: "Every screenshot, export and download presents the same small dilemma: JPG or PNG? The two formats solve different problems, and picking the wrong one means either blurry details or bloated files. Here's the practical difference." },
      { type: "h2", text: "What JPG is great at" },
      { type: "p", text: "JPG (or JPEG) uses lossy compression engineered for photographs. It throws away detail your eye barely notices and rewards you with small files — a photo saved as JPG might be 5-10× smaller than the same image as PNG. For anything with gradients, skies, skin tones and natural textures, JPG is usually the right call." },
      { type: "h2", text: "What PNG is great at" },
      { type: "p", text: "PNG is lossless and supports transparency. That makes it the winner for: screenshots of text and interfaces, logos and icons, images that need a transparent background, and anything that will be edited and re-saved repeatedly (no quality loss each round). Text in PNG stays pixel-crisp; text in JPG develops fuzzy halos." },
      { type: "h2", text: "The quick decision rule" },
      {
        type: "list",
        items: [
          "Photo of the real world → JPG.",
          "Screenshot, diagram, chart or anything with text → PNG.",
          "Needs a transparent background → PNG (JPG can't do transparency at all).",
          "Publishing on the modern web → consider WebP as well — it often beats both.",
        ],
      },
      { type: "h2", text: "Converting between them" },
      { type: "p", text: "Real work constantly needs both: a screenshot that must go into a photo collage, a product photo that needs a transparent background removed first. Converting is a one-drop job — the JPG to PNG and PNG to JPG tools handle it in your browser, no upload to a server required." },
      { type: "callout", text: "Convert PNG screenshots to JPG before emailing them — they often shrink 80%.", toolSlug: "png-to-jpg", toolName: "PNG to JPG" },
      { type: "p", text: "One caution: converting JPG → PNG doesn't restore lost quality — it just preserves what's left, in a bigger file. Go the other way (PNG → JPG) when size matters, and keep the PNG master when quality does." },
    ],
  },
  {
    slug: "how-to-convert-word-to-pdf-online",
    title: "How to Convert Word to PDF Online",
    description:
      "Turn DOCX files into polished, universally readable PDFs in seconds — free, private and formatting-friendly. Here's how.",
    date: "2026-03-04",
    readingMinutes: 4,
    category: "Conversion Tutorials",
    tags: ["word", "pdf", "docx", "conversion"],
    relatedTools: ["word-to-pdf", "pdf-to-word", "excel-to-pdf", "ppt-to-pdf"],
    content: [
      { type: "p", text: "PDF is the format of record for resumes, applications, contracts and anything you want to look the same on every screen. Word documents aren't that — fonts shift, layouts wobble, and tracked changes sneak along. Converting Word to PDF locks your formatting down, and it takes seconds." },
      { type: "h2", text: "Step 1: Open the Word to PDF tool" },
      { type: "p", text: "The Word to PDF converter reads .docx files — the default format for Word 2007 and later, plus Google Docs exports and LibreOffice saves. Everything happens locally in your browser: your document is never uploaded to any server." },
      { type: "h2", text: "Step 2: Drop in your DOCX" },
      { type: "p", text: "Drag your file onto the upload area or click to browse. The tool reads the document's text, structure and images, then lays them out into clean, paginated PDF pages. Headings, lists, bold and italic text, and images all carry over." },
      { type: "callout", text: "Convert your resume to PDF before sending it — recruiters see identical formatting every time.", toolSlug: "word-to-pdf", toolName: "Word to PDF" },
      { type: "h2", text: "Step 3: Download and verify" },
      { type: "p", text: "Hit Convert and download your PDF. Take five seconds to scroll through it — if a particularly complex layout needs a tweak, adjusting the source document and re-converting is faster than fighting with a PDF editor afterwards." },
      { type: "h2", text: "Going the other direction" },
      { type: "p", text: "Need to edit a PDF you received as a Word-style document? The PDF to Word tool extracts text into an editable .docx. And the same family covers the rest of Office: Excel to PDF and PowerPoint to PDF work the same browser-based way." },
      { type: "p", text: "A quick tip before you convert: turn off tracked changes and comments in Word first — what shows on your screen is what the PDF will capture." },
    ],
  },
  {
    slug: "best-free-online-tools-for-everyday-work",
    title: "Best Free Online Tools for Everyday Work",
    description:
      "The everyday digital tasks that eat your time — and the free browser tools that fix them in seconds. A practical toolkit for normal people.",
    date: "2026-03-12",
    readingMinutes: 6,
    category: "Productivity",
    tags: ["productivity", "free tools", "online tools", "workflow"],
    relatedTools: ["ai-text-summarizer", "password-generator", "qr-code-generator", "json-formatter", "unit-converter"],
    content: [
      { type: "p", text: "Most people's workdays are punctuated by tiny digital chores: a file in the wrong format, a password that meets new rules, a long article that needs reading before a meeting. Each one is small; together they add up to real time. Here's a practical toolkit of free browser tools that clears them in seconds." },
      { type: "h2", text: "File fixing: the biggest time sink" },
      { type: "p", text: "Format problems dominate the list: a PDF that needs to be one document, an image that needs to be smaller, a Word file someone needs as PDF by end of day. The fix is always the same shape — open a tool, drop the file, download the result. Merging PDFs, compressing images, converting formats: each is a one-minute task when you know where the tool lives." },
      { type: "h2", text: "Writing helpers" },
      {
        type: "list",
        items: [
          "Summarize a 3,000-word report before a meeting with an AI summarizer — the short version keeps the argument intact.",
          "Count words and characters precisely when a brief has hard limits — no manual estimating.",
          "Convert accidental ALL-CAPS or sloppy case in copied text with one click.",
          "Clean text copied from PDFs — strip the weird line breaks and double spaces in one pass.",
        ],
      },
      { type: "callout", text: "Paste any long text and get the key points in seconds.", toolSlug: "ai-text-summarizer", toolName: "AI Text Summarizer" },
      { type: "h2", text: "Security and codes" },
      { type: "p", text: "Generating a strong, unique password for yet another account is a 5-second task with the right generator — pick your length and character rules, copy, done. The same goes for QR codes for an event poster or a Wi-Fi card, or a quick UUID when you're testing something." },
      { type: "h2", text: "Developer quick fixes" },
      { type: "p", text: "If you build things, the everyday list grows: format a JSON blob someone pasted into chat, validate an XML file, test a regex against sample data, or decode a base64 string. All of these are faster in a dedicated browser tool than in a throwaway script." },
      { type: "h2", text: "Why browser tools win" },
      { type: "p", text: "The pattern behind all of these: no install, no account, no cost — just open and use. When tools run locally in your browser, they're also private by default, which matters for work documents. Bookmark the ones you use weekly and the daily friction quietly disappears." },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(slug: string, count = 2): BlogPost[] {
  return POSTS.filter((p) => p.slug !== slug).slice(0, count);
}
