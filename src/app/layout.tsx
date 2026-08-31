import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matacos Deportes — Tienda Online & POS",
  description: "Sistema Integral de Gestión, POS Offline y E-commerce para Matacos Deportes (Saavedra 241, Formosa)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
