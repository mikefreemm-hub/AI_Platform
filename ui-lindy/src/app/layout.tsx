import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UI Lindy — Universal AI Builder",
  description: "Lindy-style UI clone (layout/UX only).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-neutral-950 text-neutral-100 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
