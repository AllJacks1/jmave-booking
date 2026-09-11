import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "J-Mave Cars | Booking System",
  description:
    "Book your trusted car rental in Davao with J-Mave Cars. Convenience & Quality Combined.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
