import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const SITE_URL = "https://rishikrrontala-bot.github.io/habitat-pulse-hero";
// The old description undersold this as "a scroll-expansion hero" — it's
// the actual tool. This is what shows in search results and link previews.
const DESCRIPTION =
  "Search any place on Earth for its live air quality, current weather, and IUCN-threatened species recorded nearby. Real data from Open-Meteo and GBIF — no accounts, no API keys, nothing invented.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Habitat Pulse — Every Place Has A Pulse",
  description: DESCRIPTION,
  authors: [{ name: "Rishik Rontala", url: "https://github.com/rishikrrontala-bot" }],
  creator: "Rishik Rontala",
  keywords: [
    "air quality",
    "threatened species",
    "IUCN Red List",
    "GBIF",
    "Open-Meteo",
    "conservation",
    "biodiversity",
    "climate",
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Habitat Pulse",
    title: "Habitat Pulse — Every Place Has A Pulse",
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Habitat Pulse — live air quality, weather, and threatened species for any place on Earth",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Habitat Pulse — Every Place Has A Pulse",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  // Google Search Console verification. Paste the content value from
  // Search Console's "HTML tag" method here and redeploy — Next renders it
  // as <meta name="google-site-verification" ...> in <head>.
  // verification: { google: "PASTE_TOKEN_HERE" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
