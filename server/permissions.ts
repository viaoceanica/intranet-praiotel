import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { customRoles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export type Permission =
  | "canViewTickets"
  | "canCreateTickets"
  | "canEditTickets"
  | "canDeleteTickets"
  | "canManageUsers"
  | "canManageClients"
  | "canManageEquipment"
  | "canViewStats"
  | "canManageSettings";

/**
 * Obtém todas as permissões de um utilizador baseado no seu role
 */
export async function getUserPermissions(userRole: string): Promise<Set<Permission>> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao conectar à base de dados",
    });
  }

  // Buscar o role do utilizador
  const [role] = await db
    .select()
    .from(customRoles)
    .where(eq(customRoles.name, userRole))
    .limit(1);

  if (!role) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Role não encontrado",
    });
  }

  // Parsear permissões do campo JSON
  const permissions: Permission[] = JSON.parse(role.permissions);

  // Converter para Set de permissões
  return new Set(permissions);
}

/**
 * Verifica se um utilizador tem uma permissão específica
 */
export async function hasPermission(
  userRole: string,
  permission: Permission
): Promise<boolean> {
  const permissions = await getUserPermissions(userRole);
  return permissions.has(permission);
}

/**
 * Middleware para verificar permissões em procedures tRPC
 * Lança erro se o utilizador não tiver a permissão necessária
 */
export async function requirePermission(
  userRole: string,
  permission: Permission
): Promise<void> {
  const hasAccess = await hasPermission(userRole, permission);

  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Permissão necessária: ${permission}`,
    });
  }
}
