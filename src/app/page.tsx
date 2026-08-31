import { CheckCircle2, ShieldCheck, Terminal } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        {/* Icono de estado */}
        <div className="mx-auto w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        {/* Título y subtítulo */}
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Matacos Deportes
        </h1>
        <p className="text-xs uppercase tracking-wider text-emerald-700 font-semibold mt-1">
          Saavedra 241 — Formosa
        </p>

        {/* Mensaje informativo */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-left">
          <div className="flex items-center space-x-2 text-slate-800 font-medium text-sm mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Entorno Configurado con Éxito</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma ORM y Dexie.js (Offline-First) están listos para comenzar el desarrollo.
          </p>
        </div>

        {/* Indicador de inicio */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-slate-400">
          <Terminal className="w-3.5 h-3.5" />
          <span>Práctica Profesional Supervisada I — UCP</span>
        </div>
      </div>
    </main>
  );
}
