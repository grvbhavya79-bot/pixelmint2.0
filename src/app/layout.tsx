import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/layout/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pixelmint.fun — Mint ideas. Ship pixels.",
    template: "%s | Pixelmint.fun",
  },
  description:
    "Pixelmint.fun is a creative digital studio for brands that refuse to blend in. We craft sharp identities, expressive websites, and digital experiences that people remember.",
  keywords: [
    "Pixelmint",
    "creative studio",
    "digital studio",
    "brand identity",
    "web design",
    "web development",
    "motion design",
    "digital products",
  ],
  applicationName: "Pixelmint.fun",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: "Pixelmint.fun",
    title: "Pixelmint.fun — Mint ideas. Ship pixels.",
    description:
      "We craft sharp identities, expressive websites, and digital experiences that people remember.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixelmint.fun — Mint ideas. Ship pixels.",
    description:
      "A creative digital studio for brands that refuse to blend in. Sharp identities, expressive websites, memorable digital experiences.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#080A0A",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pixelmint.fun",
  url: siteUrl,
  slogan: "Mint ideas. Ship pixels.",
  description:
    "A creative digital studio crafting sharp identities, expressive websites, and digital experiences that people remember.",
  email: "hello@pixelmint.fun",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${grotesk.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-[#080A0A] font-sans text-[#EFF3EE] antialiased">
        <ThemeProvider forcedTheme="dark">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#67F5B4] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#080A0A]"
          >
            Skip to main content
          </a>
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
