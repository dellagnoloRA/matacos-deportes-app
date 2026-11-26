"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { loginSchema, LoginInput } from "@/schemas/auth";
import {
  deleteSessionCookie,
  getSession,
  SessionPayload,
} from "@/lib/session";
import { deleteCustomerSessionCookie } from "@/lib/customerSession";
import {
  USER_WITH_PERMISSIONS_INCLUDE,
  issueStaffSessionCookie,
} from "@/server/services/staffAuthService";
import {
  loginCustomerAction,
  type CustomerProfileDTO,
} from "@/server/actions/ecommerce/customerActions";
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

export interface UnifiedLoginInput {
  identifier: string;
  password: string;
  guestFavorites?: string[];
}

export interface UnifiedLoginResult {
  success: boolean;
  error?: string;
  accountType?: "STAFF" | "CUSTOMER";
  redirectTo?: string;
  user?: {
    id: string;
    name: string;
    username: string | null;
    email: string;
    profileName: string | null;
    level: number;
  };
  customer?: CustomerProfileDTO;
  linkedOrdersCount?: number;
  migratedFavoritesCount?: number;
}

/**
 * Iniciar sesión con Usuario o Correo y Contraseña (Personal Interno)
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

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanId, mode: "insensitive" } },
          { email: { equals: cleanId, mode: "insensitive" } },
        ],
      },
      include: USER_WITH_PERMISSIONS_INCLUDE,
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

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: "Usuario o contraseña incorrectos",
      };
    }

    await issueStaffSessionCookie(user);
    await deleteCustomerSessionCookie();

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
  } catch (error: unknown) {
    console.error("Error en loginAction:", error);
    return {
      success: false,
      error: "Ocurrió un error inesperado al procesar el ingreso",
    };
  }
}

/**
 * Login Unificado (Clientes + Administradores y Empleados):
 * 1. Si las credenciales coinciden con un `User` interno, autentica en `matacos_session`
 *    y redirige al Panel de Gestión (`/admin`).
 * 2. Caso contrario, autentica como `Customer` en `matacos_customer_token` y redirige a `/cuenta`.
 */
export async function unifiedLoginAction(
  input: UnifiedLoginInput
): Promise<UnifiedLoginResult> {
  try {
    const validated = loginSchema.safeParse({
      identifier: input.identifier,
      password: input.password,
    });

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Datos de acceso inválidos",
      };
    }

    const cleanId = validated.data.identifier.trim().toLowerCase();
    const { password } = validated.data;

    // 1. Verificar si corresponde a un Administrador o Empleado (por usuario o correo)
    const staffUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanId, mode: "insensitive" } },
          { email: { equals: cleanId, mode: "insensitive" } },
        ],
      },
      include: USER_WITH_PERMISSIONS_INCLUDE,
    });

    if (staffUser) {
      const isStaffPasswordValid = await bcrypt.compare(
        password,
        staffUser.password
      );
      if (isStaffPasswordValid) {
        if (!staffUser.active) {
          return {
            success: false,
            error:
              "La cuenta de este usuario se encuentra suspendida o inactiva",
          };
        }

        await issueStaffSessionCookie(staffUser);
        await deleteCustomerSessionCookie();

        try {
          revalidatePath("/admin");
          revalidatePath("/pos");
        } catch {
          // Ignorar en testing fuera de contexto HTTP
        }

        return {
          success: true,
          accountType: "STAFF",
          redirectTo: "/admin",
          user: {
            id: staffUser.id,
            name: staffUser.name,
            username: staffUser.username,
            email: staffUser.email,
            profileName: staffUser.profile?.name || null,
            level: staffUser.profile?.level || 1,
          },
        };
      }
    }

    // 2. Verificar si corresponde a una cuenta de Cliente E-commerce (si ingresó correo)
    if (cleanId.includes("@")) {
      const customerRes = await loginCustomerAction({
        email: cleanId,
        password,
        guestFavorites: input.guestFavorites || [],
      });

      if (customerRes.success && customerRes.data) {
        await deleteSessionCookie();
        return {
          success: true,
          accountType: "CUSTOMER",
          redirectTo: "/cuenta",
          customer: customerRes.data.customer,
          linkedOrdersCount: customerRes.data.linkedOrdersCount,
          migratedFavoritesCount: customerRes.data.migratedFavoritesCount,
        };
      }

      if (
        customerRes.error &&
        customerRes.error.includes("Continuar con Google")
      ) {
        return {
          success: false,
          error: customerRes.error,
        };
      }
    }

    return {
      success: false,
      error: "Correo/usuario o contraseña incorrectos",
    };
  } catch (error: unknown) {
    console.error("Error en unifiedLoginAction:", error);
    return {
      success: false,
      error: "Ocurrió un error inesperado al iniciar sesión",
    };
  }
}

/**
 * Cerrar sesión activa y destruir cookies
 */
export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    await deleteSessionCookie();
    await deleteCustomerSessionCookie();
    try {
      revalidatePath("/admin");
      revalidatePath("/pos");
      revalidatePath("/cuenta");
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
