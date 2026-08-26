import type { ToolDefinition } from "../types";

export const GENERATOR_TOOLS: ToolDefinition[] = [
  {
    slug: "password-generator",
    name: "Password Generator",
    category: "generators",
    description: "Create strong random passwords with length and character controls.",
    longDescription:
      "Generate cryptographically secure passwords using the Web Crypto API. Choose length and character sets, read the live strength meter, and exclude look-alike characters if you want passwords that are easy to type.",
    tags: ["password", "generator", "secure", "random", "strong", "strength"],
    popular: true,
    component: "PasswordGeneratorTool",
    icon: "KeyRound",
    process: "local",
    faqs: [
      {
        q: "Are these passwords safe to use?",
        a: "Yes. They are generated locally with crypto.getRandomValues — the same secure randomness used for encryption keys — and never leave your device.",
      },
      {
        q: "How long should a password be?",
        a: "16+ characters with mixed character types is a strong baseline for most accounts. Longer is always stronger — prefer length over exotic symbols.",
      },
    ],
  },
  {
    slug: "random-number-generator",
    name: "Random Number Generator",
    category: "generators",
    description: "Roll random numbers in any range — with unique-only mode and dice presets.",
    longDescription:
      "Pick single numbers or batches from any min/max range, with or without duplicates, plus quick presets for dice (1-6), coin flips and lottery-style draws.",
    tags: ["random", "number", "generator", "dice", "roll", "range", "lottery"],
    component: "RandomNumberTool",
    icon: "Dices",
    process: "local",
  },
  {
    slug: "lorem-ipsum-generator",
    name: "Lorem Ipsum Generator",
    category: "generators",
    description: "Generate placeholder text as words, sentences or paragraphs.",
    longDescription:
      "Classic lorem ipsum for mockups and layouts: choose a quantity of paragraphs, sentences or words, start with 'Lorem ipsum...' if you like, and copy the result.",
    tags: ["lorem", "ipsum", "placeholder", "dummy", "text", "filler"],
    component: "LoremTool",
    icon: "AlignLeft",
    process: "local",
  },
  {
    slug: "qr-code-reader",
    name: "QR Code Reader",
    category: "generators",
    description: "Upload an image and instantly detect and decode the QR codes inside.",
    longDescription:
      "Read QR codes from PNG, JPG, WEBP and BMP images entirely offline. Detected content is shown with its type — URL, Wi-Fi, email or plain text — and one-tap actions.",
    tags: ["qr", "read", "scan", "decode", "detect", "qrcode"],
    component: "QrReaderTool",
    icon: "ScanLine",
    process: "local",
  },
  {
    slug: "color-picker",
    name: "Color Picker",
    category: "generators",
    description: "Pick any color and get its HEX, RGB and HSL values plus shades and tints.",
    longDescription:
      "A full color workspace: visual picker, HEX/RGB/HSL readouts in every notation, a shade and tint scale, complementary and analogous suggestions, and copy buttons everywhere.",
    tags: ["color", "picker", "hex", "rgb", "hsl", "palette"],
    component: "ColorPickerTool",
    icon: "Pipette",
    process: "local",
  },
  {
    slug: "color-converter",
    name: "Color Converter",
    category: "generators",
    description: "Convert colors between HEX, RGB and HSL in any direction.",
    longDescription:
      "Enter a color in any format and instantly get the others — including shorthand HEX, percentage RGB and normalized HSL — with a live preview swatch.",
    tags: ["color", "convert", "hex", "rgb", "hsl", "converter"],
    component: "ColorConverterTool",
    icon: "Palette",
    process: "local",
  },
  {
    slug: "unix-timestamp-converter",
    name: "Unix Timestamp Converter",
    category: "generators",
    description: "Convert Unix timestamps to human dates and back — seconds or milliseconds.",
    longDescription:
      "Paste a Unix timestamp to see local and UTC time, ISO 8601 and relative age — or enter a date to get its timestamp. Current time ticks live with one-click copy.",
    tags: ["unix", "timestamp", "epoch", "date", "convert", "time"],
    component: "UnixTimestampTool",
    icon: "Clock",
    process: "local",
  },
  {
    slug: "url-encoder-decoder",
    name: "URL Encoder / Decoder",
    category: "generators",
    description: "Percent-encode or decode URLs and query parameters safely.",
    longDescription:
      "Encode reserved characters for use in URLs and query strings, or decode percent-encoding back to readable text — with component-safe and full-URI modes.",
    tags: ["url", "encode", "decode", "percent", "uri", "escape"],
    component: "UrlCodecTool",
    icon: "Link2",
    process: "local",
  },
  {
    slug: "html-entity-encoder-decoder",
    name: "HTML Entity Encoder / Decoder",
    category: "generators",
    description: "Escape HTML special characters or decode entities back to text.",
    longDescription:
      "Convert <, >, &, quotes and non-ASCII characters into safe HTML entities — or reverse the process. Essential for pasting code examples into web pages.",
    tags: ["html", "entity", "entities", "encode", "decode", "escape", "special characters"],
    component: "HtmlEntityTool",
    icon: "Brackets",
    process: "local",
  },
  {
    slug: "url-shortener",
    name: "URL Shortener",
    category: "generators",
    description: "Shorten long links, track clicks, set expiry and manage them from one place.",
    longDescription:
      "Create short, shareable /s/ links in one click. Every link counts its clicks, can carry an expiration date, and can be deactivated at any time — with a live clipboard-ready result.",
    tags: ["url", "shortener", "short link", "link", "share", "clicks"],
    popular: true,
    component: "UrlShortenerTool",
    icon: "Link",
    process: "server",
    faqs: [
      {
        q: "Do shortened links expire?",
        a: "Only if you set an expiration date when creating them. Otherwise they keep working until you disable or delete the link.",
      },
      {
        q: "Can I see how many people clicked my link?",
        a: "Yes — the creator shows live click counts, and the site administrator can view full statistics in the dashboard.",
      },
    ],
  },
];
