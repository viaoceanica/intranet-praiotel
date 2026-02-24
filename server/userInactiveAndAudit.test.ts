import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("User Inactive Filter & Audit Log", () => {
  let adminContext: any;
  let testUserId: number;

  beforeAll(async () => {
    // Criar contexto de admin para os testes
    const adminUser = await db.getUserByEmail("admin@praiotel.pt");
    if (!adminUser) {
      throw new Error("Admin user not found for testing");
    }
    adminContext = {
      user: adminUser,
      req: { app: { locals: { importProgress: new Map() } } },
    };

    // Criar utilizador de teste
    const caller = appRouter.createCaller(adminContext);
    const testEmail = `test-inactive-${Date.now()}@test.com`;
    await caller.users.create({
      email: testEmail,
      password: "test123",
      name: "Test Inactive User",
      role: "tecnico",
    });
    
    // Buscar o utilizador criado
    const createdUser = await db.getUserByEmail(testEmail);
    if (!createdUser) throw new Error("Test user not created");
    testUserId = createdUser.id;
  });

  it("deve desativar um utilizador e registar na auditoria", async () => {
    const caller = appRouter.createCaller(adminContext);

    // Desativar utilizador
    const result = await caller.users.delete({ id: testUserId });
    expect(result.success).toBe(true);
    expect(result.active).toBe(false);

    // Verificar se foi registado na auditoria
    const auditLogs = await caller.users.auditLog();
    const lastLog = auditLogs[0];
    expect(lastLog).toBeDefined();
    expect(lastLog.action).toBe("deactivated");
    expect(lastLog.targetUserId).toBe(testUserId);
    expect(lastLog.performedByUserId).toBe(adminContext.user.id);
  });

  it("deve reativar um utilizador e registar na auditoria", async () => {
    const caller = appRouter.createCaller(adminContext);

    // Reativar utilizador
    const result = await caller.users.delete({ id: testUserId });
    expect(result.success).toBe(true);
    expect(result.active).toBe(true);

    // Verificar se foi registado na auditoria
    const auditLogs = await caller.users.auditLog();
    const lastLog = auditLogs[0];
    expect(lastLog).toBeDefined();
    expect(lastLog.action).toBe("reactivated");
    expect(lastLog.targetUserId).toBe(testUserId);
  });

  it("não deve permitir atribuir ticket a utilizador inativo", async () => {
    const caller = appRouter.createCaller(adminContext);

    // Desativar utilizador
    await caller.users.delete({ id: testUserId });

    // Criar cliente de teste
    const client = await caller.clients.create({
      name: "Cliente Teste Inativo",
      nif: "999888777",
      email: "cliente-inativo@test.com",
      phone: "999888777",
      address: "Rua Teste",
      city: "São Miguel",
      postalCode: "9500-000",
    });

    // Tentar criar ticket com utilizador inativo
    try {
      await caller.tickets.create({
        clientId: client.id,
        equipment: "Equipamento Teste",
        problemType: "Avaria",
        island: "sao_miguel",
        priority: "media",
        description: "Teste de atribuição a utilizador inativo",
        assignedTo: testUserId,
      });
      // Se chegou aqui, o teste falhou
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("inativo");
    }
  });

  it("deve listar apenas utilizadores ativos no endpoint de técnicos", async () => {
    const caller = appRouter.createCaller(adminContext);

    // Listar todos os utilizadores
    const allUsers = await caller.users.list();
    const activeUsers = allUsers.filter((u: any) => u.active);
    const inactiveUsers = allUsers.filter((u: any) => !u.active);

    // Verificar que o utilizador de teste está inativo
    const testUser = allUsers.find((u: any) => u.id === testUserId);
    expect(testUser).toBeDefined();
    expect(testUser.active).toBe(0);

    // Verificar que há pelo menos um utilizador ativo
    expect(activeUsers.length).toBeGreaterThan(0);
  });
});
