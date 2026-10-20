"use client";

import React, { useState } from "react";
import { X, Ruler } from "lucide-react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "calzado" | "indumentaria";
}

export function SizeGuideModal({
  isOpen,
  onClose,
  defaultTab = "calzado",
}: SizeGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"calzado" | "indumentaria">(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-[#00A811]" />
            <h3 className="text-base font-black uppercase text-slate-900 tracking-tight">
              Tabla y Guía de Talles
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 px-5 pt-3 gap-3 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("calzado")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === "calzado"
                ? "border-[#00D615] text-slate-950 font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            Calzado & Crocs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("indumentaria")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === "indumentaria"
                ? "border-[#00D615] text-slate-950 font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            Indumentaria & Mallas
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600">
          {activeTab === "calzado" ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Guía de equivalencias estándar para calzado deportivo y zuecos Crocs:
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">Talle AR</th>
                      <th className="p-2.5">Crocs (US)</th>
                      <th className="p-2.5">Medida pie (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="p-2.5 font-bold">36</td>
                      <td className="p-2.5 font-semibold text-emerald-700">M4 / W6</td>
                      <td className="p-2.5">22.5 - 23.0 cm</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2.5 font-bold">37</td>
                      <td className="p-2.5 font-semibold text-emerald-700">M5 / W7</td>
                      <td className="p-2.5">23.5 - 24.0 cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">38</td>
                      <td className="p-2.5 font-semibold text-emerald-700">M6 / W8</td>
                      <td className="p-2.5">24.5 - 25.0 cm</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2.5 font-bold">39</td>
                      <td className="p-2.5 font-semibold text-emerald-700">M7 / W9</td>
                      <td className="p-2.5">25.0 - 25.5 cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">40</td>
                      <td className="p-2.5 font-semibold text-emerald-700">M8 / W10</td>
                      <td className="p-2.5">26.0 - 26.5 cm</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2.5 font-bold">41</td>
                      <td className="p-2.5 font-semibold text-emerald-700">M9 / W11</td>
                      <td className="p-2.5">27.0 - 27.5 cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">42</td>
                      <td className="p-2.5 font-semibold text-emerald-700">M10 / W12</td>
                      <td className="p-2.5">28.0 - 28.5 cm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Medidas de referencia para mallas de competición y prendas deportivas:
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">Talle</th>
                      <th className="p-2.5">Pecho (cm)</th>
                      <th className="p-2.5">Cintura (cm)</th>
                      <th className="p-2.5">Cadera (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="p-2.5 font-bold">XS</td>
                      <td className="p-2.5">80 - 85</td>
                      <td className="p-2.5">60 - 65</td>
                      <td className="p-2.5">85 - 90</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2.5 font-bold">S</td>
                      <td className="p-2.5">86 - 91</td>
                      <td className="p-2.5">66 - 71</td>
                      <td className="p-2.5">91 - 96</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">M</td>
                      <td className="p-2.5">92 - 97</td>
                      <td className="p-2.5">72 - 77</td>
                      <td className="p-2.5">97 - 102</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2.5 font-bold">L</td>
                      <td className="p-2.5">98 - 103</td>
                      <td className="p-2.5">78 - 83</td>
                      <td className="p-2.5">103 - 108</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">XL</td>
                      <td className="p-2.5">104 - 110</td>
                      <td className="p-2.5">84 - 90</td>
                      <td className="p-2.5">109 - 115</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900">
            <strong>¿Tenés dudas con tu talle?</strong> Acercate al local de Saavedra 241 para probarte sin compromiso o consultanos directamente por WhatsApp.
          </div>
        </div>
      </div>
    </div>
  );
}

