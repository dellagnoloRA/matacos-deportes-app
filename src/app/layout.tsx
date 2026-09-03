import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Back Office & Dashboard — Matacos Deportes",
  description: "Sistema Integral de Gestión, POS Offline y E-commerce para Matacos Deportes (Saavedra 241, Formosa)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased min-h-screen bg-[#f3f4f6] text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}

