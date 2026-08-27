import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PwaRegister } from "@/components/layout/pwa-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pixelmint.fun — Every Tool. One Smart Place. | 100+ Free Online Tools",
    template: "%s | Pixelmint.fun",
  },
  description:
    "Pixelmint.fun gives you 100+ free online tools for PDFs, images, files, text, productivity, developers and more. Convert, edit, compress, create and organize — fast, private and easy.",
  keywords: [
    "online tools",
    "free tools",
    "PDF tools",
    "image tools",
    "file converter",
    "developer tools",
    "calculators",
    "AI tools",
    "Pixelmint",
  ],
  authors: [{ name: "Grv Bhavya" }],
  creator: "Grv Bhavya",
  applicationName: "Pixelmint.fun",
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
    siteName: "Pixelmint.fun",
    title: "Pixelmint.fun — Every Tool. One Smart Place.",
    description:
      "Convert, edit, compress, create, and organize files with 100+ fast, free online tools. No sign-up, no install — most tools run right in your browser.",
    url: siteUrl,
    images: [{ url: "/icons/og-image.png", width: 1200, height: 630, alt: "Pixelmint.fun — Every tool. One smart place." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixelmint.fun — Every Tool. One Smart Place.",
    description: "100+ free online tools for PDFs, images, files, text, productivity and more.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7FAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#0C1310" },
  ],
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Pixelmint.fun",
      alternateName: "Pixelmint",
      url: siteUrl,
      logo: `${siteUrl}/icons/icon-512.png`,
      slogan: "Every tool. One smart place.",
      description:
        "Pixelmint.fun offers 100+ free online tools for PDFs, images, files, text, productivity, developers and more.",
      founder: { "@type": "Person", name: "Grv Bhavya" },
      email: "hello@pixelmint.fun",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Madhubani",
        addressRegion: "Bihar",
        postalCode: "847226",
        addressCountry: "IN",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Pixelmint.fun",
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/tools?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
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
