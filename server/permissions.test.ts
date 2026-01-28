import { describe, it, expect, beforeAll } from "vitest";
import { getUserPermissions, hasPermission } from "./permissions";
import { getDb } from "./db";
import { customRoles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Sistema de Permissões", () => {
  beforeAll(async () => {
    // Garantir que os roles padrão existem
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Verificar se role admin existe
    const [adminRole] = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.name, "admin"))
      .limit(1);

    if (!adminRole) {
      // Inserir role admin para testes
      await db.insert(customRoles).values({
        name: "admin",
        description: "Administrador do sistema",
        isSystem: 1,
        permissions: JSON.stringify([
          "canViewTickets",
          "canCreateTickets",
          "canEditTickets",
          "canDeleteTickets",
          "canManageUsers",
          "canManageClients",
          "canManageEquipment",
          "canViewStats",
          "canManageSettings",
        ]),
        createdById: 1,
      });
    }
  });

  it("deve retornar todas as permissões para role admin", async () => {
    const permissions = await getUserPermissions("admin");

    expect(permissions.size).toBeGreaterThan(0);
    expect(permissions.has("canViewTickets")).toBe(true);
    expect(permissions.has("canCreateTickets")).toBe(true);
    expect(permissions.has("canEditTickets")).toBe(true);
    expect(permissions.has("canDeleteTickets")).toBe(true);
    expect(permissions.has("canManageUsers")).toBe(true);
    expect(permissions.has("canManageClients")).toBe(true);
    expect(permissions.has("canManageEquipment")).toBe(true);
    expect(permissions.has("canViewStats")).toBe(true);
    expect(permissions.has("canManageSettings")).toBe(true);
  });

  it("deve verificar permissão específica corretamente", async () => {
    const hasDelete = await hasPermission("admin", "canDeleteTickets");
    expect(hasDelete).toBe(true);
  });

  it("deve retornar false para permissão inexistente", async () => {
    const hasInvalid = await hasPermission("admin", "canDoAnything" as any);
    expect(hasInvalid).toBe(false);
  });

  it("deve lançar erro para role inexistente", async () => {
    await expect(getUserPermissions("role_inexistente")).rejects.toThrow();
  });
});
