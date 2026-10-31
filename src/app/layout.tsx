import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "LaunchBase · Find your foundation",
  description:
    "Match your SaaS idea and constraints to a transparent foundation catalog.",
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
