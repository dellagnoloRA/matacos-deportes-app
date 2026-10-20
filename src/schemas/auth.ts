import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "El usuario o correo es obligatorio")
    .trim(),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").trim(),
  username: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .regex(/^[a-zA-Z0-9._-]+$/, "Solo letras, números, puntos, guiones y guiones bajos")
    .toLowerCase()
    .trim(),
  email: z.string().email("Correo electrónico inválido").toLowerCase().trim(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  profileId: z.string().uuid("Perfil de acceso inválido"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").trim(),
  username: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .regex(/^[a-zA-Z0-9._-]+$/, "Solo letras, números, puntos, guiones y guiones bajos")
    .toLowerCase()
    .trim(),
  email: z.string().email("Correo electrónico inválido").toLowerCase().trim(),
  profileId: z.string().uuid("Perfil de acceso inválido"),
  active: z.boolean(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const createProfileSchema = z.object({
  name: z.string().min(2, "El nombre del perfil debe tener al menos 2 caracteres").trim(),
  description: z.string().optional(),
  parentProfileId: z.string().uuid("Perfil base inválido").nullable().optional(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
