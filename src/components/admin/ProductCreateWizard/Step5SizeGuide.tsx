"use client";

import React, { useState } from "react";
import { WizardFormState, SizeGuideItem } from "./types";
import {
  Ruler,
  Plus,
  Search,
  Check,
  AlertTriangle,
  Info,
  Copy,
  Table,
  Trash2,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  Footprints,
  Shirt,
  Layers,
  X,
} from "lucide-react";
import { createSizeGuide } from "@/server/actions/sizeGuideActions";

interface Step5Props {
  form: WizardFormState;
  updateForm: (updates: Partial<WizardFormState>) => void;
  sizeGuides: SizeGuideItem[];
  refreshSizeGuides: () => Promise<void>;
  brands: { id: string; name: string }[];
}

export const Step5SizeGuide: React.FC<Step5Props> = ({
  form,
  updateForm,
  sizeGuides,
  refreshSizeGuides,
  brands,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Estado del editor de nueva guía
  const [newGuideName, setNewGuideName] = useState("");
  const [newGuideBrandId, setNewGuideBrandId] = useState("");
  const [newGuideGender, setNewGuideGender] = useState("UNISEX");
  const [newGuideType, setNewGuideType] = useState("CALZADO");
  const [newGuideUnit, setNewGuideUnit] = useState("cm");
  const [newGuideFitNote, setNewGuideFitNote] = useState("");
  const [newColumns, setNewColumns] = useState<string[]>([
    "Talle AR",
    "US",
    "UK",
    "EU",
    "Largo Pie (cm)",
  ]);
  const [newRows, setNewRows] = useState<string[][]>([
    ["39", "7.0", "6.0", "40", "25.0"],
    ["40", "7.5", "6.5", "40.5", "25.5"],
    ["41", "8.5", "7.5", "42", "26.5"],
    ["42", "9.0", "8.0", "42.5", "27.0"],
  ]);
  const [pasteExcelText, setPasteExcelText] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);

  // Guía actualmente seleccionada
  const selectedGuide = sizeGuides.find((g) => g.id === form.sizeGuideId);

  // Filtrado de guías
  const filteredGuides = sizeGuides.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.brandName && g.brandName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "ALL" || g.type === filterType;
    return matchesSearch && matchesType;
  });

  // Validación cruzada: talles cargados en variantes vs talles de la guía
  const variantSizes = Array.from(new Set(form.variants.map((v) => v.size).filter(Boolean)));
  const guideSizes = selectedGuide
    ? selectedGuide.rows.map((r) => r[selectedGuide.columns[0]] || r["Talle"] || r["Talle AR"]).filter(Boolean)
    : [];

  const missingSizes = variantSizes.filter((vs) => !guideSizes.includes(vs));

  // Aplicar plantilla base en el editor
  const handleApplyTemplate = (type: "calzado" | "remera" | "pantalon") => {
    if (type === "calzado") {
      setNewGuideName("Guía Calzado Deportivo");
      setNewGuideType("CALZADO");
      setNewColumns(["Talle AR", "US", "UK", "EU", "Largo Pie (cm)"]);
      setNewRows([
        ["38", "6.0", "5.5", "39", "24.5"],
        ["39", "7.0", "6.0", "40", "25.0"],
        ["40", "7.5", "6.5", "40.5", "25.5"],
        ["41", "8.5", "7.5", "42", "26.5"],
        ["42", "9.0", "8.0", "42.5", "27.0"],
        ["43", "10.0", "9.0", "44", "28.0"],
      ]);
    } else if (type === "remera") {
      setNewGuideName("Guía Remeras y Tops");
      setNewGuideType("PRENDA_SUPERIOR");
      setNewColumns(["Talle", "Pecho (cm)", "Cintura (cm)", "Cadera (cm)"]);
      setNewRows([
        ["S", "88-94", "76-82", "88-94"],
        ["M", "95-102", "83-90", "95-102"],
        ["L", "103-110", "91-98", "103-110"],
        ["XL", "111-118", "99-106", "111-118"],
      ]);
    } else {
      setNewGuideName("Guía Shorts y Pantalones");
      setNewGuideType("PRENDA_INFERIOR");
      setNewColumns(["Talle", "Cintura (cm)", "Cadera (cm)", "Largo (cm)"]);
      setNewRows([
        ["S", "76-82", "88-94", "98"],
        ["M", "83-90", "95-102", "100"],
        ["L", "91-98", "103-110", "102"],
        ["XL", "99-106", "111-118", "104"],
      ]);
    }
  };

  // Pegar desde Excel (TSV)
  const handleParseExcelPaste = () => {
    if (!pasteExcelText.trim()) return;
    const lines = pasteExcelText.trim().split(/\r?\n/);
    if (lines.length < 2) return;

    const headers = lines[0].split("\t").map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const values = line.split("\t");
      return headers.map((_, i) => values[i]?.trim() || "");
    });

    setNewColumns(headers);
    setNewRows(rows);
    setShowPasteArea(false);
    setPasteExcelText("");
  };

  // Agregar una nueva columna
  const handleAddColumn = () => {
    let colNumber = newColumns.length + 1;
    let newColName = `Columna ${colNumber}`;
    while (newColumns.includes(newColName)) {
      colNumber++;
      newColName = `Columna ${colNumber}`;
    }

    setNewColumns((prev) => [...prev, newColName]);
    setNewRows((prevRows) => prevRows.map((row) => [...row, ""]));
  };

  // Renombrar una columna existente (sin tocar ni alterar los datos de las filas)
  const handleRenameColumn = (newName: string, colIndex: number) => {
    setNewColumns((prev) => {
      const updated = [...prev];
      updated[colIndex] = newName;
      return updated;
    });
  };

  // Quitar una columna existente
  const handleRemoveColumn = (colIndex: number) => {
    if (newColumns.length <= 1) {
      alert("La guía debe tener al menos una columna.");
      return;
    }

    setNewColumns((prev) => prev.filter((_, idx) => idx !== colIndex));
    setNewRows((prevRows) => prevRows.map((row) => row.filter((_, idx) => idx !== colIndex)));
  };

  // Modificar celda individual
  const handleCellChange = (value: string, rIdx: number, cIdx: number) => {
    setNewRows((prevRows) => {
      const updated = [...prevRows];
      const updatedRow = [...updated[rIdx]];
      updatedRow[cIdx] = value;
      updated[rIdx] = updatedRow;
      return updated;
    });
  };

  // Agregar fila
  const handleAddRow = () => {
    setNewRows((prev) => [...prev, new Array(newColumns.length).fill("")]);
  };

  // Eliminar fila
  const handleRemoveRow = (rIdx: number) => {
    setNewRows((prev) => prev.filter((_, i) => i !== rIdx));
  };

  // Guardar nueva guía en PostgreSQL
  const handleSaveGuide = async () => {
    if (!newGuideName.trim()) {
      alert("Por favor ingresa un nombre para la guía.");
      return;
    }

    // Asegurar nombres de columnas válidos
    const finalColumns = newColumns.map((c, i) => c.trim() || `Columna ${i + 1}`);

    const formattedRows: Record<string, string>[] = newRows.map((row) => {
      const rowObj: Record<string, string> = {};
      finalColumns.forEach((colName, cIdx) => {
        rowObj[colName] = row[cIdx] || "";
      });
      return rowObj;
    });

    const res = await createSizeGuide({
      name: newGuideName.trim(),
      brandId: newGuideBrandId || form.brandId || null,
      gender: newGuideGender,
      type: newGuideType,
      unit: newGuideUnit,
      fitNote: newGuideFitNote,
      columns: finalColumns,
      rows: formattedRows,
    });

    if (res.success && res.data) {
      await refreshSizeGuides();
      updateForm({ sizeGuideId: res.data.id, useSizeGuide: true });
      setIsCreatingNew(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">5. Guía de Talles y Medidas</h2>
        <p className="text-xs text-slate-500">
          Entidad reutilizable para que los clientes elijan su talle exacto sin devoluciones.
        </p>
      </div>

      {/* Switch: ¿Usa guía de talles? */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs">
        <div>
          <span className="text-xs font-bold text-slate-900 block">
            ¿Este producto requiere Guía de Talles?
          </span>
          <span className="text-[11px] text-slate-500">
            Desactívalo solo si el producto es talle único, accesorio o pelota.
          </span>
        </div>

        <button
          type="button"
          onClick={() => updateForm({ useSizeGuide: !form.useSizeGuide })}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            form.useSizeGuide ? "bg-emerald-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              form.useSizeGuide ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Si NO usa guía de talles */}
      {!form.useSizeGuide && (
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Se indicó que este producto <strong>no usa guía de talles</strong>. El paso está
            completo.
          </span>
        </div>
      )}

      {/* Si SÍ usa guía de talles */}
      {form.useSizeGuide && (
        <div className="space-y-5">
          {/* Alerta de Validación Cruzada si faltan talles */}
          {selectedGuide && missingSizes.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Advertencia de validación cruzada:</strong>
                <p className="mt-0.5 text-[11px]">
                  Los siguientes talles configurados en las variantes no figuran en la tabla de la
                  guía seleccionada:{" "}
                  <span className="font-bold font-mono">{missingSizes.join(", ")}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Guía actualmente asignada */}
          {selectedGuide && !isCreatingNew && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Ruler className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-emerald-950 block">
                      {selectedGuide.name}
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      {selectedGuide.type} · {selectedGuide.gender} · {selectedGuide.rows.length} talles
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Modal Cliente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm({ sizeGuideId: null })}
                    className="text-xs text-slate-500 hover:text-red-600 underline font-medium cursor-pointer"
                  >
                    Cambiar
                  </button>
                </div>
              </div>

              {selectedGuide.fitNote && (
                <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded border border-emerald-100">
                  <strong>Nota de calce:</strong> {selectedGuide.fitNote}
                </div>
              )}
            </div>
          )}

          {/* Selector de Guías Existentes y Botón Crear */}
          {!isCreatingNew && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900">
                  Seleccionar Guía Existente del Catálogo
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Nueva Guía</span>
                </button>
              </div>

              {/* Filtros rápidos */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o marca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="ALL">Todos los tipos</option>
                  <option value="CALZADO">Calzado</option>
                  <option value="PRENDA_SUPERIOR">Prenda Superior</option>
                  <option value="PRENDA_INFERIOR">Prenda Inferior</option>
                  <option value="ACCESORIO">Accesorios</option>
                </select>
              </div>

              {/* Lista de guías seleccionables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {filteredGuides.map((guide) => {
                  const isSelected = form.sizeGuideId === guide.id;
                  return (
                    <div
                      key={guide.id}
                      onClick={() => updateForm({ sizeGuideId: guide.id, useSizeGuide: true })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <div>
                        <strong className="text-xs text-slate-950 block">{guide.name}</strong>
                        <span className="text-[10px] text-slate-400">
                          {guide.type} · {guide.rows.length} talles ({guide.unit})
                        </span>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 hover:text-slate-800">
                          Elegir
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formulario / Editor Completo de Nueva Guía */}
          {isCreatingNew && (
            <div className="p-4 rounded-2xl border-2 border-emerald-500/60 bg-white space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-950">
                    Editor de Guía de Talles Reutilizable
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 underline font-medium cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              {/* Plantillas Base Rápidas */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Empezar con una plantilla base:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate("calzado")}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <Footprints className="w-3.5 h-3.5 text-slate-600" />
                    <span>Calzado Deportivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate("remera")}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <Shirt className="w-3.5 h-3.5 text-slate-600" />
                    <span>Remeras y Tops</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate("pantalon")}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-600" />
                    <span>Shorts y Calzas</span>
                  </button>
                </div>
              </div>

              {/* Datos de la Guía */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-900">
                    Nombre de la Guía <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Calzado Running Asics Adulto"
                    value={newGuideName}
                    onChange={(e) => setNewGuideName(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-900">Tipo</label>
                  <select
                    value={newGuideType}
                    onChange={(e) => setNewGuideType(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="CALZADO">Calzado</option>
                    <option value="PRENDA_SUPERIOR">Prenda Superior</option>
                    <option value="PRENDA_INFERIOR">Prenda Inferior</option>
                    <option value="ACCESORIO">Accesorio</option>
                  </select>
                </div>
              </div>

              {/* Nota de Calce */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-900">
                  Nota de Calce (Recomendación al cliente)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Calce ajustado, recomendamos pedir medio talle más."
                  value={newGuideFitNote}
                  onChange={(e) => setNewGuideFitNote(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Controles y Botón Pegar desde Excel */}
              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Tabla de Medidas ({newRows.length} talles)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors shadow-2xs"
                    title="Agregar una nueva columna a la tabla"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Agregar Columna</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasteArea(!showPasteArea)}
                    className="text-xs text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{showPasteArea ? "Ocultar pegado" : "Pegar desde Excel (TSV)"}</span>
                  </button>
                </div>
              </div>

              {/* Área de pegado desde Excel */}
              {showPasteArea && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Copia las celdas de Excel con encabezados y pégalas aquí..."
                    value={pasteExcelText}
                    onChange={(e) => setPasteExcelText(e.target.value)}
                    className="w-full p-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseExcelPaste}
                      className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 cursor-pointer"
                    >
                      Procesar y Llenar Tabla
                    </button>
                  </div>
                </div>
              )}

              {/* Grilla Editable de Columnas y Filas */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-64 shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                    <tr>
                      {newColumns.map((col, cIdx) => (
                        <th key={cIdx} className="p-2 min-w-[120px]">
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 focus-within:border-emerald-500 shadow-2xs">
                            <input
                              type="text"
                              value={col}
                              onChange={(e) => handleRenameColumn(e.target.value, cIdx)}
                              className="w-full bg-transparent font-bold text-slate-800 text-xs focus:outline-none"
                              title="Editar nombre de columna"
                            />
                            {newColumns.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveColumn(cIdx)}
                                className="text-slate-300 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                                title={`Eliminar columna "${col}"`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="p-2 w-10 text-center">
                        <button
                          type="button"
                          onClick={handleAddColumn}
                          className="w-6 h-6 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center cursor-pointer transition-colors mx-auto"
                          title="Agregar Columna"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {newRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        {newColumns.map((_, cIdx) => (
                          <td key={cIdx} className="p-1.5">
                            <input
                              type="text"
                              value={row[cIdx] || ""}
                              onChange={(e) => handleCellChange(e.target.value, rIdx, cIdx)}
                              className="w-full min-w-[100px] h-7 px-1.5 rounded border border-slate-200 text-xs focus:border-emerald-500 focus:outline-none bg-white"
                            />
                          </td>
                        ))}
                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(rIdx)}
                            className="p-1 text-slate-300 hover:text-red-500 cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botón Agregar Fila */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="text-xs text-slate-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Agregar Fila de Talle</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveGuide}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar y Vincular Guía
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal interactivo de Vista Previa Cliente */}
      {isPreviewModalOpen && selectedGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-950">{selectedGuide.name}</h3>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {selectedGuide.fitNote && (
              <div className="p-3 bg-amber-50 text-amber-900 rounded-lg text-xs">
                <strong>Nota de calce:</strong> {selectedGuide.fitNote}
              </div>
            )}

            <div className="overflow-x-auto max-h-64 border rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 font-bold border-b">
                  <tr>
                    {selectedGuide.columns.map((c) => (
                      <th key={c} className="p-2">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedGuide.rows.map((row, i) => (
                    <tr key={i}>
                      {selectedGuide.columns.map((col) => (
                        <td key={col} className="p-2">
                          {row[col] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
