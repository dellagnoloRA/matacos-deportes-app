"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { loginSchema, LoginInput } from "@/schemas/auth";
import {
  encryptSession,
  setSessionCookie,
  deleteSessionCookie,
  getSession,
  SessionPayload,
} from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    name: string;
    username: string | null;
    email: string;
    profileName: string | null;
    level: number;
  };
}

/**
 * Iniciar sesión con Usuario o Correo y Contraseña
 */
export async function loginAction(input: LoginInput): Promise<LoginResult> {
  try {
    const validated = loginSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Datos de acceso inválidos",
      };
    }

    const { identifier, password } = validated.data;
    const cleanId = identifier.trim().toLowerCase();

    // 1. Buscar usuario por username o email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanId }, { email: cleanId }],
      },
      include: {
        profile: {
          include: {
            permissions: {
              include: { permission: true },
            },
            parentProfile: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Usuario o contraseña incorrectos",
      };
    }

    if (!user.active) {
      return {
        success: false,
        error: "La cuenta de este usuario se encuentra suspendida o inactiva",
      };
    }

    // 2. Comparar contraseña con el hash bcryptjs
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: "Usuario o contraseña incorrectos",
      };
    }

    // 3. Resolver permisos efectivos (directos + heredados)
    const permissionsSet = new Set<string>();

    if (user.profile) {
      // Permisos directos del perfil
      user.profile.permissions.forEach((pp) => {
        if (pp.permission?.code) {
          permissionsSet.add(pp.permission.code);
        }
      });

      // Permisos heredados del perfil padre (si tiene jerarquía reflexiva)
      if (user.profile.parentProfile) {
        user.profile.parentProfile.permissions.forEach((pp) => {
          if (pp.permission?.code) {
            permissionsSet.add(pp.permission.code);
          }
        });
      }

      // Si es el Administrador, asegurar que conserve acceso administrativo
      if (user.profile.name.toLowerCase().includes("admin")) {
        permissionsSet.add("admin.usuarios");
        permissionsSet.add("admin.perfiles");
      }
    }

    const effectivePermissions = Array.from(permissionsSet);

    // 4. Crear payload de sesión y guardar cookie
    const sessionPayload: SessionPayload = {
      userId: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      profileId: user.profileId,
      profileName: user.profile?.name || null,
      level: user.profile?.level || 1,
      permissions: effectivePermissions,
    };

    const token = await encryptSession(sessionPayload);
    await setSessionCookie(token);

    try {
      revalidatePath("/admin");
      revalidatePath("/pos");
    } catch {
      // Ignorar en testing fuera de contexto HTTP
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileName: user.profile?.name || null,
        level: user.profile?.level || 1,
      },
    };
  } catch (error: any) {
    console.error("Error en loginAction:", error);
    return {
      success: false,
      error: "Ocurrió un error inesperado al procesar el ingreso",
    };
  }
}

/**
 * Cerrar sesión activa y destruir cookie
 */
export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    await deleteSessionCookie();
    try {
      revalidatePath("/admin");
      revalidatePath("/pos");
    } catch {
      // Ignorar en testing
    }
    return { success: true };
  } catch (error) {
    console.error("Error en logoutAction:", error);
    return { success: false };
  }
}

/**
 * Obtener la sesión del usuario conectado en servidor
 */
export async function getCurrentUserAction(): Promise<SessionPayload | null> {
  try {
    return await getSession();
  } catch (error) {
    console.error("Error en getCurrentUserAction:", error);
    return null;
  }
}

/**
 * Comprobar si el usuario conectado posee un permiso atómico
 */
export async function hasPermission(permissionCode: string): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session) return false;
    return session.permissions?.includes(permissionCode) ?? false;
  } catch {
    return false;
  }
}
