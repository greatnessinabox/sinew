import type { Metadata } from "next";
import localFont from "next/font/local";
import { SkipLink } from "./components/skip-link";
import { ConsoleEasterEgg } from "./components/console-easter-egg";
import { KeyboardShortcuts, KeyboardShortcutsHint } from "./components/keyboard-shortcuts";
import { ThemeScript } from "./components/theme-toggle";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Sinew - Copy-Paste Infrastructure Patterns for Developers",
  description:
    "The connective tissue that makes applications work. Copy-paste infrastructure patterns for databases, auth, deployment, and more.",
  metadataBase: new URL("https://sinew.marquis.codes"),
  openGraph: {
    title: "Sinew - Copy-Paste Infrastructure Patterns for Developers",
    description:
      "The connective tissue that makes applications work. Copy-paste infrastructure patterns for databases, auth, deployment, and more.",
    siteName: "Sinew",
    type: "website",
    images: [
      {
        url: "https://sinew.marquis.codes/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Sinew - Copy-Paste Infrastructure Patterns for Developers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sinew - Copy-Paste Infrastructure Patterns for Developers",
    description:
      "The connective tissue that makes applications work. Copy-paste infrastructure patterns for databases, auth, deployment, and more.",
    images: ["https://sinew.marquis.codes/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      {/*
        ╔═══════════════════════════════════════════════════════════╗
        ║                                                           ║
        ║   👋 Hey there, fellow developer!                         ║
        ║                                                           ║
        ║   You're the kind of person who views source.             ║
        ║   We respect that.                                        ║
        ║                                                           ║
        ║   Sinew is open source:                                   ║
        ║   → github.com/greatnessinabox/sinew                      ║
        ║                                                           ║
        ║   Built with Next.js 15, TypeScript, and Tailwind CSS.    ║
        ║   No tracking. No ads. Just patterns.                     ║
        ║                                                           ║
        ╚═══════════════════════════════════════════════════════════╝
      */}
      <head>
        <ThemeScript />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConsoleEasterEgg />
        <SkipLink />
        <KeyboardShortcuts />
        <KeyboardShortcutsHint />
        {children}
      </body>
    </html>
  );
}
