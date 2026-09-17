import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanskrit Live - Incremental Shloka Annotation & OCR Pipeline",
  description: "Interactive Sanskrit Shloka Reader with 0ms Hover Annotations, Sandhi Vigraha, Morphology, and Multi-Layer Lexicon Lookup.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sa" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Noto+Serif+Devanagari:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
