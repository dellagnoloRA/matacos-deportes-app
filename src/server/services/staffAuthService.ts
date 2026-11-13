import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  encryptSession,
  setSessionCookie,
  type SessionPayload,
} from "@/lib/session";

export const USER_WITH_PERMISSIONS_INCLUDE = {
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
} as const satisfies Prisma.UserInclude;

export type UserWithPermissions = Prisma.UserGetPayload<{
  include: typeof USER_WITH_PERMISSIONS_INCLUDE;
}>;

/**
 * Resuelve el conjunto de códigos de permiso efectivos (directos + heredados de perfil padre).
 */
export function resolveUserEffectivePermissions(
  user: UserWithPermissions
): string[] {
  const permissionsSet = new Set<string>();

  if (user.profile) {
    user.profile.permissions.forEach((pp) => {
      if (pp.permission?.code) {
        permissionsSet.add(pp.permission.code);
      }
    });

    if (user.profile.parentProfile) {
      user.profile.parentProfile.permissions.forEach((pp) => {
        if (pp.permission?.code) {
          permissionsSet.add(pp.permission.code);
        }
      });
    }

    if (user.profile.name.toLowerCase().includes("admin")) {
      permissionsSet.add("admin.usuarios");
      permissionsSet.add("admin.perfiles");
    }
  }

  return Array.from(permissionsSet);
}

/**
 * Construye el payload JWT de sesión interna de personal a partir de un registro User.
 */
export function buildStaffSessionPayload(
  user: UserWithPermissions
): SessionPayload {
  return {
    userId: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    profileId: user.profileId,
    profileName: user.profile?.name || null,
    level: user.profile?.level || 1,
    permissions: resolveUserEffectivePermissions(user),
  };
}

/**
 * Emite y almacena la cookie HttpOnly de sesión para personal interno (`matacos_session`).
 */
export async function issueStaffSessionCookie(
  user: UserWithPermissions
): Promise<{ token: string; sessionPayload: SessionPayload }> {
  const sessionPayload = buildStaffSessionPayload(user);
  const token = await encryptSession(sessionPayload);
  await setSessionCookie(token);
  return { token, sessionPayload };
}

/**
 * Verifica si una cuenta autenticada con Google pertenece a un Administrador o Empleado (`User`).
 * Si coincide por `googleId` o `email`, vincula `googleId` / `avatarUrl` y genera su token JWT interno.
 * Nunca crea usuarios de personal automáticamente por seguridad.
 */
export async function matchAndLoginGoogleStaffUser(params: {
  googleId: string;
  email: string;
  avatarUrl?: string | null;
}): Promise<
  | { matched: false }
  | {
      matched: true;
      success: false;
      error: string;
    }
  | {
      matched: true;
      success: true;
      token: string;
      sessionPayload: SessionPayload;
    }
> {
  const normalizedEmail = params.email.trim().toLowerCase();

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId: params.googleId },
        { email: { equals: normalizedEmail, mode: "insensitive" } },
      ],
    },
    include: USER_WITH_PERMISSIONS_INCLUDE,
  });

  if (!user) {
    return { matched: false };
  }

  if (!user.active) {
    return {
      matched: true,
      success: false,
      error:
        "Tu cuenta de personal se encuentra suspendida o inactiva. Contactá al Administrador.",
    };
  }

  if (!user.googleId || (params.avatarUrl && user.avatarUrl !== params.avatarUrl)) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: user.googleId || params.googleId,
        avatarUrl: params.avatarUrl ?? user.avatarUrl,
      },
      include: USER_WITH_PERMISSIONS_INCLUDE,
    });
  }

  const sessionPayload = buildStaffSessionPayload(user);
  const token = await encryptSession(sessionPayload);

  return {
    matched: true,
    success: true,
    token,
    sessionPayload,
  };
}
