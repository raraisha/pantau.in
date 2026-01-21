import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'aos/dist/aos.css';

// 1. Import Komponen Emergency Button
import EmergencyButton from "@/components/EmergencyButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pantau.in",
  icons: {
    icon: '/Group 32.svg',
  },
  description: "Made by Raisha Afiqah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Konten Halaman Utama */}
        {children}

        {/* 2. Pasang Emergency Button Disini 
            (Akan muncul di SEMUA halaman di atas konten lain) */}
        <EmergencyButton />
        
      </body>
    </html>
  );
}