import { getDb } from "./db";
import { customRoles, type InsertCustomRole } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export async function getAllCustomRoles(includeSystem = true) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(customRoles);
  if (!includeSystem) {
    query = query.where(eq(customRoles.isSystem, 0)) as any;
  }
  
  const roles = await query.orderBy(customRoles.name);
  return roles.map(role => ({
    ...role,
    permissions: JSON.parse(role.permissions),
  }));
}

export async function getAllRolesForSelect() {
  const db = await getDb();
  if (!db) return [];
  
  const roles = await db.select({
    value: customRoles.name,
    label: customRoles.name,
  }).from(customRoles).orderBy(customRoles.name);
  
  return roles;
}

export async function getCustomRoleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(customRoles).where(eq(customRoles.id, id)).limit(1);
  if (result.length === 0) return null;
  
  return {
    ...result[0],
    permissions: JSON.parse(result[0].permissions),
  };
}

export async function createCustomRole(data: {
  name: string;
  description?: string;
  permissions: string[];
  createdById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(customRoles).values({
    name: data.name,
    description: data.description || null,
    permissions: JSON.stringify(data.permissions),
    isSystem: 0,
    createdById: data.createdById,
  });
  
  return result;
}

export async function updateCustomRole(id: number, data: {
  name?: string;
  description?: string;
  permissions?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.permissions) updateData.permissions = JSON.stringify(data.permissions);
  
  await db.update(customRoles).set(updateData).where(eq(customRoles.id, id));
}

export async function deleteCustomRole(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se é role de sistema (não pode ser eliminado)
  const role = await getCustomRoleById(id);
  if (role && role.isSystem === 1) {
    throw new Error("Roles de sistema não podem ser eliminados");
  }
  
  await db.delete(customRoles).where(eq(customRoles.id, id));
}

// Permissões disponíveis no sistema
export const AVAILABLE_PERMISSIONS = [
  { id: "tickets.view", name: "Ver Tickets", category: "Tickets" },
  { id: "tickets.create", name: "Criar Tickets", category: "Tickets" },
  { id: "tickets.edit", name: "Editar Tickets", category: "Tickets" },
  { id: "tickets.delete", name: "Eliminar Tickets", category: "Tickets" },
  { id: "tickets.assign", name: "Atribuir Tickets", category: "Tickets" },
  
  { id: "clients.view", name: "Ver Clientes", category: "Clientes" },
  { id: "clients.create", name: "Criar Clientes", category: "Clientes" },
  { id: "clients.edit", name: "Editar Clientes", category: "Clientes" },
  { id: "clients.delete", name: "Eliminar Clientes", category: "Clientes" },
  
  { id: "equipment.view", name: "Ver Equipamentos", category: "Equipamentos" },
  { id: "equipment.create", name: "Criar Equipamentos", category: "Equipamentos" },
  { id: "equipment.edit", name: "Editar Equipamentos", category: "Equipamentos" },
  { id: "equipment.delete", name: "Eliminar Equipamentos", category: "Equipamentos" },
  
  { id: "users.view", name: "Ver Utilizadores", category: "Utilizadores" },
  { id: "users.create", name: "Criar Utilizadores", category: "Utilizadores" },
  { id: "users.edit", name: "Editar Utilizadores", category: "Utilizadores" },
  { id: "users.delete", name: "Eliminar Utilizadores", category: "Utilizadores" },
  
  { id: "stats.view", name: "Ver Estatísticas", category: "Estatísticas" },
  { id: "stats.export", name: "Exportar Relatórios", category: "Estatísticas" },
  
  { id: "config.view", name: "Ver Configurações", category: "Configurações" },
  { id: "config.edit", name: "Editar Configurações", category: "Configurações" },
  { id: "config.sla", name: "Gerir SLA", category: "Configurações" },
  { id: "config.templates", name: "Gerir Templates", category: "Configurações" },
  { id: "config.roles", name: "Gerir Roles", category: "Configurações" },
];
