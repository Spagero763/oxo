import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

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
  other: {
    "talentapp:project_verification":
      "060e9ad6da16fa013747b61aff42762a8e4d4b686ac1a3cd9f97c7f7c6ba636c637d44c302176dc808f47c858da1fdfe740265c2bef7505452c634ab94320b40",
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
