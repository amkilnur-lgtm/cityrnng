import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import "./globals.css";

/**
 * Root sans font — also serves as Cyrillic fallback for Space Grotesk,
 * which is loaded locally by the C3 foundation reference page.
 */
const sans = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CITYRNNG",
  description: "City running community platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
