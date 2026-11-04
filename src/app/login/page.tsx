"use client";

import React, { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/server/actions/authActions";
import { LogIn, User, Lock, AlertCircle, ShieldCheck } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/admin";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password.trim()) {
      setError("Por favor completa el usuario y la contraseña.");
      return;
    }

    startTransition(async () => {
      const res = await loginAction({
        identifier: identifier.trim(),
        password: password.trim(),
      });

      if (res.success) {
        router.push(redirectPath);
        router.refresh();
      } else {
        setError(res.error || "Credenciales incorrectas.");
      }
    });
  };

  const fillQuickAccount = (user: string, pass: string) => {
    setIdentifier(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="w-full max-w-md bg-[#111215] border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-200">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 mb-3">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Matacos Deportes
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Sistema de Gestión, POS y Control de Accesos
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Usuario o Correo
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ej: admin o cajero1"
              autoFocus
              disabled={isPending}
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isPending}
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-950/40"
        >
          <LogIn className="w-4 h-4" />
          {isPending ? "Verificando..." : "Iniciar Sesión"}
        </button>
      </form>

      {/* Cuentas Rápidas para Pruebas del Backend */}
      <div className="mt-6 pt-5 border-t border-neutral-800/80">
        <p className="text-[11px] font-medium text-slate-400 mb-2.5 text-center">
          ⚡ Accesos rápidos para pruebas de roles:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => fillQuickAccount("admin", "MatacosAdmin2026!")}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-left transition-colors"
          >
            <div className="font-semibold text-emerald-400">👑 Admin</div>
            <div className="text-[10px] text-slate-500 truncate">admin (Acceso Total)</div>
          </button>

          <button
            type="button"
            onClick={() => fillQuickAccount("encargado", "Encargado241!")}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-left transition-colors"
          >
            <div className="font-semibold text-blue-400">🛡️ Encargado</div>
            <div className="text-[10px] text-slate-500 truncate">encargado (Supervisión)</div>
          </button>

          <button
            type="button"
            onClick={() => fillQuickAccount("cajero1", "Caja241Saavedra!")}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-left transition-colors"
          >
            <div className="font-semibold text-amber-400">💵 Cajero</div>
            <div className="text-[10px] text-slate-500 truncate">cajero1 (Cajero Mostrador)</div>
          </button>

          <button
            type="button"
            onClick={() => fillQuickAccount("vendedor", "Vendedor241!")}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-left transition-colors"
          >
            <div className="font-semibold text-purple-400">🏷️ Vendedor</div>
            <div className="text-[10px] text-slate-500 truncate">vendedor (Salón de Ventas)</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#06241d] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white font-bold text-sm">Cargando acceso...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
