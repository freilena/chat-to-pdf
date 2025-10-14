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
  title: "Chat to Your PDF",
  description: "Upload PDFs and ask questions with citations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header style={{ borderBottom: '1px solid #eaeaea' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <h1 style={{ margin: 0, fontSize: '20px' }}>Chat to Your PDF</h1>
          </div>
        </header>
        <main>
          <div className="container" style={{ padding: '16px 0' }}>
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
