import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Skeleton AI · Your micro-SaaS foundation",
  description:
    "Turn a client brief into reviewed requirements, a proposed micro-SaaS foundation and a clear build plan.",
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
