import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js + Auth",
  description: "A minimal Next.js starter with NextAuth.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
