"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";

interface SearchableSelectProps {
  label?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
  allowCustomValue?: boolean;
}

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Selecciona una opción",
  disabled = false,
  required = false,
  error,
  allowCustomValue = true,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-focus the search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Filtered options based on user typing
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const handleSelect = (selected: string) => {
    onChange(selected);
    setIsOpen(false);
    setSearchQuery("");
  };

  const isCustomOptionApplicable =
    allowCustomValue &&
    searchQuery.trim().length > 1 &&
    !options.some(
      (opt) => opt.toLowerCase() === searchQuery.trim().toLowerCase()
    );

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs text-left transition-all cursor-pointer ${
          disabled
            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            : isOpen
            ? "border-[#00D615] ring-2 ring-[#00D615]/30 bg-white"
            : error
            ? "border-red-500 ring-1 ring-red-400 bg-white"
            : value
            ? "border-slate-300 text-slate-900 bg-white hover:border-slate-400"
            : "border-slate-300 text-slate-400 bg-white hover:border-slate-400"
        }`}
      >
        <span className="truncate font-medium">
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-slate-700" : ""
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00D615] bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options Scrollable List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-slate-50">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected =
                  value.toLowerCase() === option.toLowerCase();
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-900 font-bold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">{option}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#00A811] shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                No se encontraron resultados
              </div>
            )}

            {/* Fallback to allow custom locality typing */}
            {isCustomOptionApplicable && (
              <button
                type="button"
                onClick={() => handleSelect(searchQuery.trim())}
                className="w-full text-left px-3.5 py-2.5 text-xs bg-slate-50 hover:bg-emerald-50 text-slate-800 font-bold border-t border-slate-200 flex items-center gap-2 cursor-pointer"
              >
                <span>Usar:</span>
                <span className="text-[#00A811] underline truncate">
                  "{searchQuery.trim()}"
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 font-medium mt-1 animate-in fade-in duration-150">{error}</p>
      )}
    </div>
  );
}

