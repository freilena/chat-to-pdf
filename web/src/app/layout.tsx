import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import VersionBadge from "@/components/VersionBadge";

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
          <section className="hero">
            <div className="container" style={{ padding: '24px 0' }}>
              <h2 className="section-title">Upload PDFs. Ask questions.</h2>
              <p className="section-subtitle">Grounded answers with inline citations and a viewer.</p>
            </div>
          </section>
          <div className="container" style={{ padding: '16px 0' }}>
            {children}
          </div>
        </main>
        <footer style={{ borderTop: '1px solid var(--border)', marginTop: 24 }}>
          <div className="container" style={{ padding: '12px 0', color: 'var(--muted)', fontSize: 12 }}>
            © {new Date().getFullYear()} Chat to Your PDF
          </div>
        </footer>
        <VersionBadge />
      </body>
    </html>
  );
}
