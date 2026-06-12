import type { Metadata } from "next";
import {
  Playfair_Display,
  Plus_Jakarta_Sans,
  Bagel_Fat_One,
  Caveat,
  Cormorant_Garamond,
} from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { FirebaseAnalytics } from "@/components/FirebaseAnalytics";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SmoothScroll } from "@/components/ui-vibe/SmoothScroll";
import { appUrl } from "@/lib/app-url";
import "./globals.css";

/**
 * Cinematic typography (V4). Plus Jakarta Sans for body/UI — clean, premium,
 * geometric. Playfair Display (high-contrast Didone) for display headings —
 * dramatic, classy, ticketing-marquee energy. Bagel Fat One stays loaded for
 * the wordmark / legacy admin only.
 */
const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: "variable",
});

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
});

// Kept for back-compat with admin + the wordmark.
const wordmark = Bagel_Fat_One({
  variable: "--font-wordmark",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const hand = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const APP_URL = appUrl();

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Let's Vibe — Your movie. Our space. Your vibe.",
    template: "%s · Let's Vibe",
  },
  description:
    "Private themed screens for movies, dates, birthdays, and the random Tuesday night you needed to feel something. Beach, Grass, Forest — pick your vibe.",
  applicationName: "Let's Vibe",
  keywords: [
    "private theatre",
    "private cinema",
    "date night",
    "movie booking",
    "private screening",
    "let's vibe",
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    title: "Let's Vibe — Your movie. Our space. Your vibe.",
    description:
      "Private themed screens. Book Beach, Grass, or Forest by the hour.",
    siteName: "Let's Vibe",
    url: APP_URL,
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Let's Vibe — Your movie. Our space. Your vibe.",
    description:
      "Private themed screens. Book Beach, Grass, or Forest by the hour.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${body.variable} ${display.variable} ${serif.variable} ${wordmark.variable} ${jakarta.variable} ${hand.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SmoothScroll />
          {children}
          <Toaster position="top-center" richColors />
          <FirebaseAnalytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
