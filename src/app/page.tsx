import Link from "next/link";
import { ShoppingBag, Store, Layers, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold tracking-tight">MATACOS DEPORTES</span>
            <span className="text-xs bg-emerald-700 px-2 py-0.5 rounded-full font-medium">Saavedra 241</span>
          </div>
          <nav className="flex space-x-4 text-sm font-medium">
            <Link href="/pos" className="hover:text-emerald-200 transition">POS Mostrador</Link>
            <Link href="/stock" className="hover:text-emerald-200 transition">Inventario</Link>
            <Link href="/caja" className="hover:text-emerald-200 transition">Caja</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
            Sistema Integral de Gestión & POS Offline
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Plataforma híbrida desarrollada para Matacos Deportes. Diseñada para operar de forma continua tanto en la nube como en el mostrador físico sin conexión.
          </p>
        </div>

        {/* Módulos Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:border-emerald-500 transition">
            <div>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Store className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Punto de Venta (POS)</h3>
              <p className="text-sm text-slate-600 mb-4">
                Cobro rápido optimizado para notebooks con lector de código de barras, modo 100% offline (Dexie.js) e impresión térmica.
              </p>
            </div>
            <div className="flex items-center text-xs text-emerald-700 font-semibold">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Listo para Mes 2
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:border-emerald-500 transition">
            <div>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Control de Inventario</h3>
              <p className="text-sm text-slate-600 mb-4">
                Gestión centralizada de productos, talles, colores, códigos EAN/internos y actualización masiva por inflación.
              </p>
            </div>
            <div className="flex items-center text-xs text-emerald-700 font-semibold">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Listo para Mes 2
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:border-emerald-500 transition">
            <div>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Tienda E-commerce</h3>
              <p className="text-sm text-slate-600 mb-4">
                Catálogo público 24/7 con checkout de Mercado Pago, filtros por disciplina deportiva y botón directo de WhatsApp.
              </p>
            </div>
            <div className="flex items-center text-xs text-slate-500 font-medium">
              Planificado para Mes 3
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Matacos Deportes &copy; 2026 — Práctica Profesional Supervisada I (UCP Sede Formosa)
      </footer>
    </div>
  );
}
