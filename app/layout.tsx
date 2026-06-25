import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { PixelBlastBackground } from "@/components/ui/PixelBlastBackground";

// Inter — primary typeface for body & headlines
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  display: "swap",
  variable: "--font-inter",
});

// Geist — label / caps typeface
const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Recall",
  description:
    "Internal feedback platform for the Computer Science Association, RIT Kottayam. Collect and analyse event feedback with ease.",
  robots: {
    index: false,
    follow: false,
  },
};

import { AuthProvider } from "@/lib/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geist.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body>
        <AuthProvider>
          {/* Fixed animated background — persists across all route changes */}
          <PixelBlastBackground />
          {/* All page content sits above the animation */}
          <div style={{ position: "relative", zIndex: 1, minHeight: "100dvh" }}>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}