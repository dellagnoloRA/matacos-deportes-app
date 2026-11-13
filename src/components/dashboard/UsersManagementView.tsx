"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  XCircle,
  KeyRound,
  RefreshCw,
  Search,
  Lock,
  Pencil,
} from "lucide-react";
import {
  getUsersListAction,
  getProfilesListAction,
  createUserAction,
  updateUserAction,
  toggleUserActiveAction,
  resetUserPasswordAction,
  SerializedUser,
  SerializedProfile,
} from "@/server/actions/userManagementActions";

export function UsersManagementView() {
  const [users, setUsers] = useState<SerializedUser[]>([]);
  const [profiles, setProfiles] = useState<SerializedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<SerializedUser | null>(null);
  const [editingUser, setEditingUser] = useState<SerializedUser | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    username: "",
    email: "",
    profileId: "",
    active: true,
  });

  // Formularios
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    profileId: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [uRes, pRes] = await Promise.all([
        getUsersListAction(),
        getProfilesListAction(),
      ]);

      if (uRes.success && uRes.users) {
        setUsers(uRes.users);
      } else {
        setErrorMessage(uRes.error || "No se pudo cargar la lista de usuarios");
      }

      if (pRes.success && pRes.profiles) {
        setProfiles(pRes.profiles);
        if (pRes.profiles.length > 0 && !formData.profileId) {
          setFormData((prev) => ({ ...prev, profileId: pRes.profiles![0].id }));
        }
      }
    } catch {
      setErrorMessage("Error de conexión al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await createUserAction(formData);
    setSubmitting(false);

    if (res.success) {
      setSuccessMessage(`Usuario '${formData.username}' creado exitosamente`);
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        profileId: profiles[0]?.id || "",
      });
      loadData();
    } else {
      setErrorMessage(res.error || "Error al crear usuario");
    }
  };

  const handleToggleActive = async (user: SerializedUser) => {
    const nextStatus = !user.active;
    const confirmText = nextStatus
      ? `¿Reactivar acceso para el usuario '${user.username || user.name}'?`
      : `¿Desactivar y revocar el acceso a '${user.username || user.name}'?`;

    if (!window.confirm(confirmText)) return;

    setErrorMessage(null);
    const res = await toggleUserActiveAction(user.id, nextStatus);
    if (res.success) {
      setSuccessMessage(`Estado de '${user.username}' actualizado correctamente`);
      loadData();
    } else {
      setErrorMessage(res.error || "No se pudo cambiar el estado");
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset) return;

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await resetUserPasswordAction({
      userId: selectedUserForReset.id,
      newPassword,
    });
    setSubmitting(false);

    if (res.success) {
      setSuccessMessage(`Contraseña de '${selectedUserForReset.username}' actualizada`);
      setIsResetModalOpen(false);
      setSelectedUserForReset(null);
      setNewPassword("");
    } else {
      setErrorMessage(res.error || "Error al actualizar contraseña");
    }
  };

  const openEditUserModal = (user: SerializedUser) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      username: user.username || "",
      email: user.email,
      profileId: user.profileId || profiles[0]?.id || "",
      active: user.active,
    });
    setErrorMessage(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await updateUserAction({
      userId: editingUser.id,
      name: editFormData.name,
      username: editFormData.username,
      email: editFormData.email,
      profileId: editFormData.profileId,
      active: editFormData.active,
    });
    setSubmitting(false);

    if (res.success) {
      setSuccessMessage(`Usuario '${editFormData.username}' actualizado correctamente`);
      setIsEditModalOpen(false);
      setEditingUser(null);
      loadData();
    } else {
      setErrorMessage(res.error || "Error al actualizar usuario");
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      (u.username && u.username.toLowerCase().includes(term)) ||
      u.email.toLowerCase().includes(term) ||
      (u.profileName && u.profileName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Gestión de Personal y Cuentas
            </h1>
            <p className="text-xs text-slate-500">
              Control de empleados, identificadores cortos de mostrador y perfiles asignados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            title="Refrescar lista"
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setErrorMessage(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#00D615] hover:bg-[#00c013] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Alerts Feedback */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold">✕</button>
          </div>
        )}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* Search & Stats */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, usuario, correo o rol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total: <span className="font-bold text-slate-800">{filteredUsers.length}</span> miembros registrados
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Personal</th>
                  <th className="px-5 py-3">Usuario (Mostrador)</th>
                  <th className="px-5 py-3">Correo</th>
                  <th className="px-5 py-3">Perfil Asignado</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      Cargando personal...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-[#00D615] font-black flex items-center justify-center text-xs shrink-0">
                            {u.username ? u.username.slice(0, 2).toUpperCase() : u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block leading-tight">{u.name}</span>
                            <span className="text-[10px] text-slate-400">Desde {new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <code className="bg-slate-100 text-slate-800 font-mono font-bold px-2 py-0.5 rounded border border-slate-200">
                          {u.username || "—"}
                        </code>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{u.email}</span>
                          {u.googleLinked && (
                            <span
                              title="Vinculado con Google Auth"
                              className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold"
                            >
                              Google
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Shield className="w-3 h-3 text-emerald-600" />
                          <span>{u.profileName}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-semibold">
                            <XCircle className="w-3.5 h-3.5" /> Suspendido
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => openEditUserModal(u)}
                          title="Editar usuario / correo Google"
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUserForReset(u);
                            setNewPassword("");
                            setIsResetModalOpen(true);
                          }}
                          title="Restablecer contraseña"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          title={u.active ? "Desactivar cuenta" : "Reactivar cuenta"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.active
                              ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              : "text-rose-500 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Alta Usuario */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Registrar Nuevo Empleado</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Nahir Fornari"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Usuario de Mostrador (Login ágil)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: nahir, cajero2"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Sin espacios ni mayúsculas (mínimo 3 caracteres).
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@matacosdeportes.com.ar"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Perfil y Permisos</label>
                <select
                  value={formData.profileId}
                  onChange={(e) => setFormData({ ...formData, profileId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
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
                  disabled={submitting}
                  className="px-4 py-2 bg-[#00D615] hover:bg-[#00c013] text-slate-950 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? "Creando..." : "Guardar Empleado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-600" />
                <span>Editar Empleado</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Usuario (Mostrador)</label>
                <input
                  type="text"
                  required
                  value={editFormData.username}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, username: e.target.value.toLowerCase() })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Correo Electrónico (habilitado para Google Auth)
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Si este correo coincide con una cuenta Google, el empleado ingresará directo al Panel al iniciar sesión con Google.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Perfil y Permisos</label>
                <select
                  value={editFormData.profileId}
                  onChange={(e) => setEditFormData({ ...editFormData, profileId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#00D615] hover:bg-[#00c013] text-slate-950 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {isResetModalOpen && selectedUserForReset && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Restablecer Contraseña</span>
              </h3>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Ingresa una nueva clave de acceso para{" "}
              <strong className="text-slate-800">{selectedUserForReset.name}</strong> (
              {selectedUserForReset.username}).
            </p>

            <form onSubmit={handleResetSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? "Actualizando..." : "Restablecer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
