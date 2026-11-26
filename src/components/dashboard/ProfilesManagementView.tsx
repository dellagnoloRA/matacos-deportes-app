"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Check,
  RefreshCw,
  Sliders,
  Users,
  Layers,
  ArrowRight,
  Save,
  Plus,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  getProfilesListAction,
  getAllPermissionsAction,
  updateProfilePermissionsAction,
  createProfileAction,
  deleteCustomProfileAction,
  SerializedProfile,
  SerializedPermission,
} from "@/server/actions/userManagementActions";

function getRoleScopeBadge(name: string, isSystem: boolean) {
  const lower = name.toLowerCase();
  if (lower.includes("admin")) {
    return {
      label: "Acceso Total",
      className: "bg-slate-900 text-[#00D615] border border-emerald-500/30",
    };
  }
  if (lower.includes("encargado") || lower.includes("supervisor")) {
    return {
      label: "Supervisión",
      className: "bg-sky-50 text-sky-700 border border-sky-200",
    };
  }
  if (lower.includes("cajero") || lower.includes("mostrador")) {
    return {
      label: "Caja y Cobro",
      className: "bg-amber-50 text-amber-700 border border-amber-200",
    };
  }
  if (lower.includes("vendedor") || lower.includes("salon")) {
    return {
      label: "Salón de Ventas",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    };
  }
  return {
    label: isSystem ? "Perfil Base" : "Personalizado",
    className: "bg-slate-100 text-slate-700 border border-slate-300 font-semibold",
  };
}

export function ProfilesManagementView() {
  const [profiles, setProfiles] = useState<SerializedProfile[]>([]);
  const [permissions, setPermissions] = useState<SerializedPermission[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal para crear nuevo perfil
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    parentProfileId: "",
  });
  const [creatingProfile, setCreatingProfile] = useState(false);

  const loadData = async (targetSelectId?: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [pRes, permRes] = await Promise.all([
        getProfilesListAction(),
        getAllPermissionsAction(),
      ]);

      if (pRes.success && pRes.profiles) {
        setProfiles(pRes.profiles);
        const toSelect = targetSelectId
          ? pRes.profiles.find((p) => p.id === targetSelectId)
          : selectedProfileId
          ? pRes.profiles.find((p) => p.id === selectedProfileId)
          : pRes.profiles[0];

        if (toSelect) {
          setSelectedProfileId(toSelect.id);
          setSelectedPermissions(new Set(toSelect.directPermissions));
        }
      }

      if (permRes.success && permRes.permissions) {
        setPermissions(permRes.permissions);
      }
    } catch {
      setErrorMessage("Error de conexión al cargar perfiles y permisos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeProfile = profiles.find((p) => p.id === selectedProfileId);
  const parentProfile = activeProfile?.parentProfileId
    ? profiles.find((p) => p.id === activeProfile.parentProfileId)
    : null;

  const handleSelectProfile = (p: SerializedProfile) => {
    setSelectedProfileId(p.id);
    setSelectedPermissions(new Set(p.directPermissions));
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const togglePermission = (code: string) => {
    if (!activeProfile) return;
    if (parentProfile?.directPermissions.includes(code)) return; // Ya heredado del perfil padre

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleToggleModuleAll = (moduleName: string) => {
    if (!activeProfile) return;
    const modulePerms = permissions.filter((p) => p.module === moduleName);
    const actionablePerms = modulePerms.filter(
      (p) => !parentProfile?.directPermissions.includes(p.code)
    );

    const allChecked = actionablePerms.every((p) => selectedPermissions.has(p.code));

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      actionablePerms.forEach((p) => {
        if (allChecked) {
          next.delete(p.code);
        } else {
          next.add(p.code);
        }
      });
      return next;
    });
  };

  // Único método de guardado
  const handleSave = async () => {
    if (!activeProfile) return;
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const codes = Array.from(selectedPermissions);
    const res = await updateProfilePermissionsAction(activeProfile.id, codes);
    setSaving(false);

    if (res.success) {
      setSuccessMessage(`Permisos guardados exitosamente para el perfil '${activeProfile.name}'`);
      await loadData(activeProfile.id);
    } else {
      setErrorMessage(res.error || "Error al guardar permisos del perfil");
    }
  };

  const handleCreateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingProfile(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await createProfileAction({
      name: createFormData.name,
      description: createFormData.description || undefined,
      parentProfileId: createFormData.parentProfileId || undefined,
    });
    setCreatingProfile(false);

    if (res.success && res.profile) {
      setSuccessMessage(`Perfil '${res.profile.name}' creado correctamente. Ya puedes asignarle permisos.`);
      setIsCreateModalOpen(false);
      setCreateFormData({ name: "", description: "", parentProfileId: "" });
      await loadData(res.profile.id);
    } else {
      setErrorMessage(res.error || "Error al crear perfil");
    }
  };

  const handleDeleteProfile = async (p: SerializedProfile) => {
    if (p.isSystem) return;
    if (!window.confirm(`¿Estás seguro de eliminar el perfil '${p.name}'?`)) return;

    setErrorMessage(null);
    const res = await deleteCustomProfileAction(p.id);
    if (res.success) {
      setSuccessMessage(`Perfil '${p.name}' eliminado correctamente`);
      await loadData();
    } else {
      setErrorMessage(res.error || "No se pudo eliminar el perfil");
    }
  };

  // Agrupar permisos por módulos funcionales
  const modules = Array.from(new Set(permissions.map((p) => p.module)));

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Perfiles y Permisos del Sistema (RBAC)
            </h1>
            <p className="text-xs text-slate-500">
              Crea nuevos perfiles o configura las atribuciones operativas de cada puesto con herencia de permisos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData()}
            title="Refrescar perfiles"
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Alerts Feedback */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between shadow-xs">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold">✕</button>
          </div>
        )}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-xs">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="font-bold">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Perfiles Sidebar Selector */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Perfiles ({profiles.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {profiles.map((p) => {
                  const isSelected = p.id === selectedProfileId;
                  const badge = getRoleScopeBadge(p.name, p.isSystem);

                  return (
                    <div
                      key={p.id}
                      className={`group relative rounded-xl border transition-all ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50"
                      }`}
                    >
                      <button
                        onClick={() => handleSelectProfile(p)}
                        className="w-full text-left p-3 cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">{p.name}</span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              isSelected
                                ? "bg-[#00D615] text-slate-950 font-black"
                                : badge.className
                            }`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10.5px] opacity-80 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {p.usersCount} usuarios
                          </span>
                          <span className="flex items-center gap-1">
                            <Sliders className="w-3 h-3" /> {p.directPermissions.length} permisos
                          </span>
                        </div>
                        {p.parentProfileName && (
                          <div className="text-[10px] text-sky-400 font-semibold mt-1.5 flex items-center gap-1">
                            <ArrowRight className="w-2.5 h-2.5" /> Hereda de {p.parentProfileName}
                          </div>
                        )}
                      </button>

                      {!p.isSystem && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(p);
                          }}
                          title="Eliminar perfil personalizado"
                          className="absolute right-2 bottom-2 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Permisos Matrix Main Area */}
          <div className="lg:col-span-3 space-y-4">
            {activeProfile && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5">
                {/* Active Profile Info Header WITH THE SINGLE SAVE BUTTON */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{activeProfile.name}</h2>
                      <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-semibold">
                        {getRoleScopeBadge(activeProfile.name, activeProfile.isSystem).label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {activeProfile.description || "Permite definir y ajustar las atribuciones operativas para este puesto de trabajo."}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-600 block">
                        Permisos Efectivos:{" "}
                        <strong className="text-slate-900 font-black">
                          {selectedPermissions.size + (parentProfile?.directPermissions.length || 0)}
                        </strong>{" "}
                        / {permissions.length}
                      </span>
                      {parentProfile && (
                        <span className="text-[10.5px] text-sky-600 font-medium">
                          ({selectedPermissions.size} directos + {parentProfile.directPermissions.length} heredados)
                        </span>
                      )}
                    </div>

                    {/* ÚNICO BOTÓN DE GUARDADO */}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-[#00D615] hover:bg-[#00c013] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
                    </button>
                  </div>
                </div>

                {/* Checkbox Matrix Grouped by Modules */}
                <div className="space-y-6">
                  {modules.map((mod) => {
                    const modPermissions = permissions.filter((p) => p.module === mod);
                    const actionable = modPermissions.filter(
                      (p) => !parentProfile?.directPermissions.includes(p.code)
                    );
                    const allChecked = actionable.length > 0 && actionable.every((p) => selectedPermissions.has(p.code));

                    return (
                      <div key={mod} className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Módulo {mod}</span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({modPermissions.length} acciones)
                            </span>
                          </h4>

                          {actionable.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleToggleModuleAll(mod)}
                              className="text-[10.5px] font-semibold text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              {allChecked ? (
                                <>
                                  <Square className="w-3 h-3" /> Desmarcar módulo
                                </>
                              ) : (
                                <>
                                  <CheckSquare className="w-3 h-3" /> Marcar todos
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {modPermissions.map((perm) => {
                            const isInherited = parentProfile?.directPermissions.includes(perm.code);
                            const isDirectlyChecked = selectedPermissions.has(perm.code);
                            const isChecked = isInherited || isDirectlyChecked;
                            const isDisabled = isInherited;

                            return (
                              <div
                                key={perm.code}
                                onClick={() => !isDisabled && togglePermission(perm.code)}
                                className={`flex items-start gap-3 p-3 rounded-xl border text-xs transition-all ${
                                  isChecked
                                    ? isInherited
                                      ? "bg-sky-50/70 border-sky-200 text-slate-800"
                                      : "bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-2xs"
                                    : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
                                } ${isDisabled ? "cursor-default" : "cursor-pointer"}`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border transition-all ${
                                    isChecked
                                      ? isInherited
                                        ? "bg-sky-500 border-sky-500 text-white"
                                        : "bg-[#00D615] border-[#00c013] text-slate-950 font-black"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <code className="font-mono text-[11px] font-bold text-slate-800">
                                      {perm.code}
                                    </code>
                                    {isInherited && (
                                      <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                                        Heredado
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-tight">
                                    {perm.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Crear Nuevo Perfil */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Crear Nuevo Perfil de Acceso</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProfileSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Perfil</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Encargado de Turno Mañana, Auditor de Stock"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción / Función</label>
                <input
                  type="text"
                  placeholder="Ej: Supervisión de caja y transferencias de depósito"
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Herencia Jerárquica (Opcional)
                </label>
                <select
                  value={createFormData.parentProfileId}
                  onChange={(e) => setCreateFormData({ ...createFormData, parentProfileId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
                >
                  <option value="">Ninguno (Perfil independiente)</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      Heredar permisos de: {p.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  El nuevo perfil adoptará automáticamente los permisos del perfil seleccionado.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingProfile}
                  className="px-4 py-2 bg-[#00D615] hover:bg-[#00c013] text-slate-950 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {creatingProfile ? "Creando..." : "Crear Perfil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
