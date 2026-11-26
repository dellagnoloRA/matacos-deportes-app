"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  createUserSchema,
  CreateUserInput,
  updateUserSchema,
  UpdateUserInput,
  resetPasswordSchema,
  ResetPasswordInput,
  createProfileSchema,
  CreateProfileInput,
} from "@/schemas/auth";
import { hasPermission, getCurrentUserAction } from "./authActions";
import { revalidatePath } from "next/cache";

export interface SerializedUser {
  id: string;
  name: string;
  username: string | null;
  email: string;
  googleLinked: boolean;
  active: boolean;
  createdAt: string;
  profileId: string | null;
  profileName: string | null;
  profileLevel: number;
}

export interface SerializedProfile {
  id: string;
  name: string;
  description: string | null;
  level: number;
  isSystem: boolean;
  parentProfileId: string | null;
  parentProfileName: string | null;
  usersCount: number;
  directPermissions: string[];
}

export interface SerializedPermission {
  id: string;
  code: string;
  module: string;
  description: string;
}

/**
 * Obtener listado de usuarios del personal
 */
export async function getUsersListAction(): Promise<{
  success: boolean;
  users?: SerializedUser[];
  error?: string;
}> {
  try {
    const canManage = await hasPermission("admin.usuarios");
    if (!canManage) {
      return { success: false, error: "No tienes permisos para gestionar usuarios (admin.usuarios)" };
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: { id: true, name: true, level: true },
        },
      },
    });

    const serialized: SerializedUser[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      googleLinked: Boolean(u.googleId),
      active: u.active,
      createdAt: u.createdAt.toISOString(),
      profileId: u.profileId,
      profileName: u.profile?.name || "Sin perfil",
      profileLevel: u.profile?.level || 0,
    }));

    return { success: true, users: serialized };
  } catch (error: any) {
    console.error("Error en getUsersListAction:", error);
    return { success: false, error: "Error al cargar la lista de usuarios" };
  }
}

/**
 * Obtener listado de perfiles configurados con sus permisos directos
 */
export async function getProfilesListAction(): Promise<{
  success: boolean;
  profiles?: SerializedProfile[];
  error?: string;
}> {
  try {
    const canManage = await hasPermission("admin.perfiles");
    if (!canManage) {
      return { success: false, error: "No tienes permisos para ver perfiles (admin.perfiles)" };
    }

    const profiles = await prisma.profile.findMany({
      orderBy: { level: "desc" },
      include: {
        parentProfile: {
          select: { name: true },
        },
        _count: {
          select: { users: true },
        },
        permissions: {
          include: {
            permission: {
              select: { code: true },
            },
          },
        },
      },
    });

    const serialized: SerializedProfile[] = profiles.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      level: p.level,
      isSystem: p.isSystem,
      parentProfileId: p.parentProfileId,
      parentProfileName: p.parentProfile?.name || null,
      usersCount: p._count.users,
      directPermissions: p.permissions
        .map((pp) => pp.permission?.code)
        .filter((code): code is string => Boolean(code)),
    }));

    return { success: true, profiles: serialized };
  } catch (error: any) {
    console.error("Error en getProfilesListAction:", error);
    return { success: false, error: "Error al cargar perfiles" };
  }
}

/**
 * Obtener todos los permisos del catálogo maestro agrupados
 */
export async function getAllPermissionsAction(): Promise<{
  success: boolean;
  permissions?: SerializedPermission[];
  error?: string;
}> {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { code: "asc" }],
    });

    return {
      success: true,
      permissions: permissions.map((p) => ({
        id: p.id,
        code: p.code,
        module: p.module,
        description: p.description,
      })),
    };
  } catch (error: any) {
    console.error("Error en getAllPermissionsAction:", error);
    return { success: false, error: "Error al obtener permisos" };
  }
}

/**
 * Crear un nuevo usuario del personal
 */
export async function createUserAction(input: CreateUserInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const canManage = await hasPermission("admin.usuarios");
    if (!canManage) {
      return { success: false, error: "No tienes permisos para crear usuarios" };
    }

    const validated = createUserSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Datos del usuario inválidos",
      };
    }

    const { name, username, email, password, profileId } = validated.data;

    // Verificar unicidad de username y email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existing) {
      if (existing.username === username) {
        return { success: false, error: `El usuario '${username}' ya está registrado` };
      }
      return { success: false, error: `El correo '${email}' ya está registrado` };
    }

    // Hash de la contraseña con bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        profileId,
        active: true,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error en createUserAction:", error);
    return { success: false, error: "Ocurrió un error al crear el usuario" };
  }
}

/**
 * Actualizar datos de un usuario del personal (incluyendo correo Google Auth)
 */
export async function updateUserAction(
  input: UpdateUserInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const canManage = await hasPermission("admin.usuarios");
    if (!canManage) {
      return { success: false, error: "No tienes permisos para editar usuarios" };
    }

    const validated = updateUserSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Datos del usuario inválidos",
      };
    }

    const { userId, name, username, email, profileId, active } = validated.data;

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return { success: false, error: "Usuario no encontrado" };
    }

    const duplicate = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [{ username }, { email }],
      },
    });

    if (duplicate) {
      if (duplicate.username === username) {
        return { success: false, error: `El usuario '${username}' ya está en uso` };
      }
      return { success: false, error: `El correo '${email}' ya está en uso` };
    }

    const emailChanged = existing.email.toLowerCase() !== email.toLowerCase();

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        username,
        email,
        profileId,
        active,
        ...(emailChanged ? { googleId: null } : {}),
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error en updateUserAction:", error);
    return { success: false, error: "Ocurrió un error al actualizar el usuario" };
  }
}

/**
 * Alternar estado activo/inactivo de un usuario
 */
export async function toggleUserActiveAction(
  userId: string,
  newActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const canManage = await hasPermission("admin.usuarios");
    if (!canManage) {
      return { success: false, error: "No tienes permisos para modificar usuarios" };
    }

    const currentSession = await getCurrentUserAction();
    if (currentSession?.userId === userId && !newActive) {
      return { success: false, error: "No puedes desactivar tu propia cuenta activa" };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!targetUser) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // Proteger administrador principal
    if (targetUser.profile?.level === 100 && !newActive) {
      const activeAdminsCount = await prisma.user.count({
        where: {
          active: true,
          profile: { level: 100 },
        },
      });
      if (activeAdminsCount <= 1) {
        return {
          success: false,
          error: "No se puede desactivar al único Administrador General activo",
        };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { active: newActive },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error en toggleUserActiveAction:", error);
    return { success: false, error: "Error al actualizar estado del usuario" };
  }
}

/**
 * Restablecer contraseña de un usuario
 */
export async function resetUserPasswordAction(
  input: ResetPasswordInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const canManage = await hasPermission("admin.usuarios");
    if (!canManage) {
      return { success: false, error: "No tienes permisos para restablecer contraseñas" };
    }

    const validated = resetPasswordSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Contraseña inválida",
      };
    }

    const { userId, newPassword } = validated.data;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error en resetUserPasswordAction:", error);
    return { success: false, error: "Error al restablecer contraseña" };
  }
}

/**
 * Actualizar permisos de un perfil mediante casillas de verificación
 */
export async function updateProfilePermissionsAction(
  profileId: string,
  permissionCodes: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const canManage = await hasPermission("admin.perfiles");
    if (!canManage) {
      return { success: false, error: "No tienes permisos para configurar perfiles" };
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return { success: false, error: "Perfil no encontrado" };
    }

    // Garantizar que el Administrador siempre conserve el acceso a paneles de seguridad
    const codesToSave = new Set(permissionCodes);
    if (profile.name.toLowerCase().includes("admin")) {
      codesToSave.add("admin.usuarios");
      codesToSave.add("admin.perfiles");
    }

    // Obtener IDs correspondientes a los códigos de permisos provistos
    const permissions = await prisma.permission.findMany({
      where: { code: { in: Array.from(codesToSave) } },
      select: { id: true },
    });

    // Reemplazar asociaciones en una transacción atómica
    await prisma.$transaction(async (tx) => {
      await tx.profilePermission.deleteMany({
        where: { profileId },
      });

      if (permissions.length > 0) {
        await tx.profilePermission.createMany({
          data: permissions.map((p) => ({
            profileId,
            permissionId: p.id,
          })),
        });
      }
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error en updateProfilePermissionsAction:", error);
    return { success: false, error: "Error al guardar permisos del perfil" };
  }
}

/**
 * Crear un nuevo perfil personalizado de acceso
 */
export async function createProfileAction(input: CreateProfileInput): Promise<{
  success: boolean;
  profile?: SerializedProfile;
  error?: string;
}> {
  try {
    const canManage = await hasPermission("admin.perfiles");
    if (!canManage) {
      return { success: false, error: "No tienes permisos para crear perfiles" };
    }

    const validated = createProfileSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Datos del perfil inválidos",
      };
    }

    const { name, description, parentProfileId } = validated.data;

    const existing = await prisma.profile.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (existing) {
      return { success: false, error: `Ya existe un perfil con el nombre '${name}'` };
    }

    const newProfile = await prisma.profile.create({
      data: {
        name,
        description: description || null,
        parentProfileId: parentProfileId || null,
        isSystem: false,
        level: 20,
      },
      include: {
        parentProfile: {
          select: { name: true },
        },
      },
    });

    revalidatePath("/admin");

    return {
      success: true,
      profile: {
        id: newProfile.id,
        name: newProfile.name,
        description: newProfile.description,
        level: newProfile.level,
        isSystem: newProfile.isSystem,
        parentProfileId: newProfile.parentProfileId,
        parentProfileName: newProfile.parentProfile?.name || null,
        usersCount: 0,
        directPermissions: [],
      },
    };
  } catch (error: any) {
    console.error("Error en createProfileAction:", error);
    return { success: false, error: "Ocurrió un error al crear el perfil" };
  }
}

/**
 * Eliminar un perfil personalizado que no tenga usuarios asignados
 */
export async function deleteCustomProfileAction(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const canManage = await hasPermission("admin.perfiles");
    if (!canManage) {
      return { success: false, error: "No tienes permisos para eliminar perfiles" };
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        _count: {
          select: { users: true, childProfiles: true },
        },
      },
    });

    if (!profile) {
      return { success: false, error: "Perfil no encontrado" };
    }

    if (profile.isSystem) {
      return { success: false, error: "Los perfiles base del sistema no pueden ser eliminados" };
    }

    if (profile._count.users > 0) {
      return {
        success: false,
        error: `No se puede eliminar: tiene ${profile._count.users} usuarios asignados. Reasigna los usuarios primero.`,
      };
    }

    if (profile._count.childProfiles > 0) {
      return {
        success: false,
        error: "No se puede eliminar: otros perfiles heredan de este.",
      };
    }

    await prisma.profile.delete({
      where: { id: profileId },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error en deleteCustomProfileAction:", error);
    return { success: false, error: "Error al eliminar el perfil" };
  }
}
