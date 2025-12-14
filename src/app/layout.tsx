import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FPS Arena - Tactical Shooting Game",
  description: "A fast-paced 3D first-person shooter game with multiple weapons and leaderboard. Play free in your browser!",
  keywords: ["FPS", "game", "shooter", "3D", "browser game", "Three.js"],
  authors: [{ name: "FPS Arena" }],
  openGraph: {
    title: "FPS Arena - Tactical Shooting Game",
    description: "A fast-paced 3D first-person shooter game with multiple weapons and leaderboard.",
    type: "website",
  },
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
        {children}
      </body>
    </html>
  );
}
