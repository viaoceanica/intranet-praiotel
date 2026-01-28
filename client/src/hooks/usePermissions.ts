import { trpc } from "../lib/trpc";

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
 * Hook para verificar permissões do utilizador atual
 * Retorna um objeto com funções para verificar permissões específicas
 */
export function usePermissions() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: permissions, isLoading } = trpc.auth.getPermissions.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  );

  /**
   * Verifica se o utilizador tem uma permissão específica
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!permissions) return false;
    return permissions.includes(permission);
  };

  /**
   * Verifica se o utilizador tem TODAS as permissões especificadas
   */
  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    if (!permissions) return false;
    return requiredPermissions.every((perm) => permissions.includes(perm));
  };

  /**
   * Verifica se o utilizador tem PELO MENOS UMA das permissões especificadas
   */
  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    if (!permissions) return false;
    return requiredPermissions.some((perm) => permissions.includes(perm));
  };

  return {
    permissions: permissions || [],
    isLoading,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
  };
}
