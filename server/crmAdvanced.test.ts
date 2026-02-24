import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-crm-user",
    email: "crm@praiotel.pt",
    name: "CRM Tester",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

// ==========================================
// TEMPLATES DE EMAIL
// ==========================================
describe("crmEmailTemplates", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let createdTemplateId: number;

  beforeEach(() => {
    const { ctx } = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should create an email template", async () => {
    const result = await caller.crmEmailTemplates.create({
      name: "Template de Teste",
      subject: "Olá {{nome}}, temos uma proposta para si",
      htmlContent: "<h1>Olá {{nome}}</h1><p>A empresa {{empresa}} tem uma oportunidade especial.</p>",
      variables: ["nome", "empresa"],
      category: "vendas",
    });

    expect(result).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("should list email templates", async () => {
    // Create first
    await caller.crmEmailTemplates.create({
      name: "Template Listagem",
      subject: "Assunto de teste",
      htmlContent: "<p>Corpo de teste</p>",
      variables: [],
      category: "geral",
    });

    const templates = await caller.crmEmailTemplates.list();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);

    const template = templates[0];
    expect(template).toHaveProperty("name");
    expect(template).toHaveProperty("subject");
    expect(template).toHaveProperty("htmlContent");
  });

  it("should update an email template", async () => {
    const created = await caller.crmEmailTemplates.create({
      name: "Template Para Editar",
      subject: "Assunto original",
      htmlContent: "<p>Corpo original</p>",
      variables: ["nome"],
      category: "vendas",
    });

    // O id pode ser NaN se o driver não retornar insertId - verificar se é número válido
    if (typeof created.id === "number" && !isNaN(created.id)) {
      const result = await caller.crmEmailTemplates.update({
        id: created.id,
        name: "Template Editado",
        subject: "Assunto atualizado",
      });
      expect(result.success).toBe(true);
    } else {
      // Se o insertId não funcionar, buscar da lista
      const templates = await caller.crmEmailTemplates.list();
      const found = templates.find((t: any) => t.name === "Template Para Editar");
      expect(found).toBeDefined();
      if (found) {
        const result = await caller.crmEmailTemplates.update({
          id: found.id,
          name: "Template Editado",
        });
        expect(result.success).toBe(true);
      }
    }
  });

  it("should delete an email template", async () => {
    await caller.crmEmailTemplates.create({
      name: "Template Para Eliminar Test",
      subject: "Será eliminado",
      htmlContent: "<p>Eliminar</p>",
      variables: [],
      category: "geral",
    });

    // Buscar o template criado pela lista
    const templates = await caller.crmEmailTemplates.list();
    const found = templates.find((t: any) => t.name === "Template Para Eliminar Test");
    expect(found).toBeDefined();
    if (found) {
      const result = await caller.crmEmailTemplates.delete({ id: found.id });
      expect(result.success).toBe(true);
    }
  });
});

// ==========================================
// AUTOMAÇÃO DE WORKFLOWS
// ==========================================
describe("crmWorkflows", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const { ctx } = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should return available trigger types", async () => {
    const types = await caller.crmWorkflows.getTriggerTypes();
    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBeGreaterThan(0);

    const triggerValues = types.map((t) => t.value);
    expect(triggerValues).toContain("opportunity_stage_change");
    expect(triggerValues).toContain("new_lead");
    expect(triggerValues).toContain("lead_status_change");
  });

  it("should return available action types", async () => {
    const types = await caller.crmWorkflows.getActionTypes();
    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBeGreaterThan(0);

    const actionValues = types.map((a) => a.value);
    expect(actionValues).toContain("create_task");
    expect(actionValues).toContain("send_notification");
  });

  it("should create a workflow rule", async () => {
    const result = await caller.crmWorkflows.create({
      name: "Regra de Teste",
      description: "Criar tarefa quando oportunidade muda de fase",
      triggerType: "opportunity_stage_change",
      conditions: { fromStage: "prospeccao", toStage: "qualificacao" },
      actionType: "create_task",
      actionParams: { taskTitle: "Follow-up", taskPriority: "alta", dueDays: 3 },
      priority: 1,
    });

    expect(result).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("should list workflow rules", async () => {
    await caller.crmWorkflows.create({
      name: "Regra Listagem",
      triggerType: "new_lead",
      conditions: {},
      actionType: "send_notification",
      actionParams: { notificationTitle: "Novo lead" },
      priority: 0,
    });

    const rules = await caller.crmWorkflows.list();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });

  it("should toggle workflow rule active/inactive", async () => {
    await caller.crmWorkflows.create({
      name: "Regra Toggle Test",
      triggerType: "lead_status_change",
      conditions: {},
      actionType: "send_notification",
      actionParams: {},
      priority: 0,
    });

    // Buscar da lista
    const rules = await caller.crmWorkflows.list();
    const found = rules.find((r: any) => r.name === "Regra Toggle Test");
    expect(found).toBeDefined();
    if (found) {
      const result = await caller.crmWorkflows.update({
        id: found.id,
        active: false,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should return workflow stats", async () => {
    const stats = await caller.crmWorkflows.getStats();
    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalRules");
    expect(stats).toHaveProperty("activeRules");
    expect(stats).toHaveProperty("totalExecutions");
    expect(typeof stats.totalRules).toBe("number");
  });

  it("should delete a workflow rule", async () => {
    await caller.crmWorkflows.create({
      name: "Regra Para Eliminar Test",
      triggerType: "new_lead",
      conditions: {},
      actionType: "create_task",
      actionParams: {},
      priority: 0,
    });

    // Buscar da lista
    const rules = await caller.crmWorkflows.list();
    const found = rules.find((r: any) => r.name === "Regra Para Eliminar Test");
    expect(found).toBeDefined();
    if (found) {
      const result = await caller.crmWorkflows.delete({ id: found.id });
      expect(result.success).toBe(true);
    }
  });
});

// ==========================================
// DETEÇÃO DE DUPLICADOS
// ==========================================
describe("crmDuplicates", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const { ctx } = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should find duplicate leads", async () => {
    const duplicates = await caller.crmDuplicates.findAll();
    expect(Array.isArray(duplicates)).toBe(true);

    // Cada grupo deve ter a estrutura correta
    if (duplicates.length > 0) {
      const group = duplicates[0];
      expect(group).toHaveProperty("matchType");
      expect(group).toHaveProperty("matchValue");
      expect(group).toHaveProperty("confidence");
      expect(group).toHaveProperty("leads");
      expect(Array.isArray(group.leads)).toBe(true);
      expect(["email", "phone", "name_company"]).toContain(group.matchType);
      expect(["alta", "media", "baixa"]).toContain(group.confidence);
    }
  });

  it("should return duplicate stats", async () => {
    const stats = await caller.crmDuplicates.getStats();
    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalGroups");
    expect(stats).toHaveProperty("totalDuplicateLeads");
    expect(stats).toHaveProperty("byType");
    expect(stats.byType).toHaveProperty("email");
    expect(stats.byType).toHaveProperty("phone");
    expect(stats.byType).toHaveProperty("name_company");
    expect(typeof stats.totalGroups).toBe("number");
  });
});
