import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PwaRegister } from "@/components/layout/pwa-register";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ToolBox100 — 100 Powerful Tools. One Simple Workspace.",
    template: "%s | ToolBox100",
  },
  description:
    "Convert, compress, edit, generate, calculate and manage your files with 100 simple, free online tools. No sign-up, no installation — most tools run right in your browser.",
  keywords: [
    "online tools", "free tools", "PDF tools", "image tools", "file converter",
    "developer tools", "calculators", "ToolBox100",
  ],
  authors: [{ name: "Grv Bhavya" }],
  creator: "Grv Bhavya",
  applicationName: "ToolBox100",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "ToolBox100",
    title: "ToolBox100 — 100 Powerful Tools. One Simple Workspace.",
    description:
      "Convert, compress, edit, generate, calculate and manage your files with simple online tools.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolBox100 — 100 Powerful Tools. One Simple Workspace.",
    description: "100 free online tools for files, documents, developers and daily calculations.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ToolBox100",
  alternateName: "ToolBox 100",
  url: siteUrl,
  description: "100 powerful online tools for everyday tasks.",
  publisher: {
    "@type": "Organization",
    name: "ToolBox100",
    founder: { "@type": "Person", name: "Grv Bhavya" },
    email: "grvbhavya79@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Madhubani",
      addressRegion: "Bihar",
      postalCode: "847226",
      addressCountry: "IN",
    },
  },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/tools?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
          >
            Skip to main content
          </a>
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <PwaRegister />
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
