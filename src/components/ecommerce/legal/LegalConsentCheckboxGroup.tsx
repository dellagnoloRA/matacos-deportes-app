"use client";

import React from "react";
import Link from "next/link";

interface LegalConsentCheckboxGroupProps {
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  onTermsChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
  disabled?: boolean;
  termsId?: string;
  privacyId?: string;
  className?: string;
}

export function LegalConsentCheckboxGroup({
  acceptedTerms,
  acceptedPrivacy,
  onTermsChange,
  onPrivacyChange,
  disabled = false,
  termsId = "consent-terms",
  privacyId = "consent-privacy",
  className = "",
}: LegalConsentCheckboxGroupProps) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Checkbox 1: Términos y Condiciones */}
      <div className="flex items-start gap-2.5">
        <input
          id={termsId}
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => onTermsChange(e.target.checked)}
          disabled={disabled}
          required
          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
        />
        <label
          htmlFor={termsId}
          className="text-xs text-slate-700 leading-snug cursor-pointer select-none"
        >
          He leído y acepto los{" "}
          <Link
            href="/terminos-y-condiciones"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-slate-900 hover:text-emerald-700 underline decoration-slate-400 hover:decoration-emerald-700 transition-colors"
          >
            Términos y Condiciones
          </Link>{" "}
          de contratación comercial. <span className="text-rose-500 font-bold">*</span>
        </label>
      </div>

      {/* Checkbox 2: Políticas de Privacidad */}
      <div className="flex items-start gap-2.5">
        <input
          id={privacyId}
          type="checkbox"
          checked={acceptedPrivacy}
          onChange={(e) => onPrivacyChange(e.target.checked)}
          disabled={disabled}
          required
          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
        />
        <label
          htmlFor={privacyId}
          className="text-xs text-slate-700 leading-snug cursor-pointer select-none"
        >
          He leído y acepto las{" "}
          <Link
            href="/politicas-de-privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-slate-900 hover:text-emerald-700 underline decoration-slate-400 hover:decoration-emerald-700 transition-colors"
          >
            Políticas de Privacidad
          </Link>{" "}
          (tratamiento y protección de datos bajo Ley 25.326). <span className="text-rose-500 font-bold">*</span>
        </label>
      </div>
    </div>
  );
}
