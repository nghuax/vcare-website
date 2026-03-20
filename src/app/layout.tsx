import type { Metadata } from "next";
import { Source_Code_Pro, Urbanist } from "next/font/google";

import "./globals.css";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin", "latin-ext"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: {
    default: "VCare",
    template: "%s | VCare",
  },
  description:
    "VCare is a healthcare support and pharmacy coordination platform for Vietnamese patients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${urbanist.variable} ${sourceCodePro.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
