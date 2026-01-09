import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Hunt Buddy",
  description: "Find your next job opportunity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
