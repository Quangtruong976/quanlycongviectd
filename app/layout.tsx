
import { useEffect } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RegisterSW from "./register-sw";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Theo dõi công việc Tỉnh đoàn",
  description: "Hệ thống quản lý công việc Tỉnh đoàn",
  manifest: "/manifest.json",

  themeColor: "#d32f2f",

  icons: {
    icon: "/logo-doan-192.png",
    apple: "/logo-doan-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return (
    <html lang="vi">
      <body>
      <RegisterSW />
        {children}
      </body>
    </html>
  );
}
