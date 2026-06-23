import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const display = Space_Grotesk({
  variable: "--font-display-src",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Inter({
  variable: "--font-sans-src",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OXO — Stake & Play",
  description:
    "A sleek noughts-and-crosses arena. Pick your mode, stake a little, outsmart the machine.",
  applicationName: "OXO",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "OXO" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  openGraph: {
    title: "OXO — Stake & Play",
    description: "Onchain noughts & crosses on Celo. Beat the bot, take the pot.",
    url: "https://oxo-iota.vercel.app",
    siteName: "OXO",
    type: "website",
  },
  other: {
    "talentapp:project_verification":
      "8c74c639dab3652d47259846dfa726ceb9a9e2c1c884b656f01d3431e58ec7cf109460aeeec9cccb3868986c1c0467895c41e13c4f3a6eaddaabb24bab8ee5e6",
  },
};

export const viewport: Viewport = {
  themeColor: "#060609",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
