import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Skeleton AI · Your SaaS foundation architect",
  description:
    "Turn a micro-SaaS idea into a clear, constraint-aware product foundation, architecture map and build plan.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
