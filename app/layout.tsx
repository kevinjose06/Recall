import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
import "./globals.css";
import { PixelBlastBackground } from "@/components/ui/PixelBlastBackground";

// Google Sans has a variable font axis — use that for best performance.
const googleSans = Google_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  display: "swap",
  variable: "--font-google-sans",
});

export const metadata: Metadata = {
  title: {
    template: "%s — CSA Recall",
    default: "CSA Recall",
  },
  description:
    "Internal feedback platform for the Computer Science Association, RIT Kottayam. Collect and analyse event feedback with ease.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={googleSans.variable}>
      <body>
        {/* Fixed animated background — persists across all route changes */}
        <PixelBlastBackground />
        {/* All page content sits above the animation */}
        <div style={{ position: "relative", zIndex: 1, minHeight: "100dvh" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
