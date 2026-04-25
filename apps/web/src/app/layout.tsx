import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Manrope, Space_Grotesk } from "next/font/google";
import { DevStateToggle } from "@/components/site/dev-state-toggle";
import { getSession } from "@/lib/session";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CITYRNNG",
  description: "City running community platform",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Hide dev toggle for real authenticated users; show otherwise on every route.
  const realSession = await getSession();
  return (
    <html
      lang="ru"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <body>
        {children}
        {!realSession ? <DevStateToggle /> : null}
      </body>
    </html>
  );
}
