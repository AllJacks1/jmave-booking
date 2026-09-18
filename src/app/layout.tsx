import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

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
      <body className="antialiased min-h-screen">
        {children}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
