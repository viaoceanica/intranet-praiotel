import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@praiotel.pt",
    name: "Test User",
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

describe("CRM Improvements - Templates nas Campanhas", () => {
  it("cria campanha com templateId", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.crmCampaigns.create({
      name: "Campanha com Template",
      type: "email",
      subject: "Teste com template",
      emailContent: "<p>Olá {{nome}}</p>",
      templateId: 1,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("cria campanha sem templateId", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.crmCampaigns.create({
      name: "Campanha sem Template",
      type: "newsletter",
      subject: "Newsletter mensal",
      emailContent: "<p>Conteúdo da newsletter</p>",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("atualiza campanha com templateId", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Listar campanhas existentes para obter um ID válido
    const campaigns = await caller.crmCampaigns.list({});
    
    if (campaigns.length === 0) {
      // Criar campanha primeiro
      const created = await caller.crmCampaigns.create({
        name: "Campanha para atualizar",
        type: "email",
      });
      // Re-listar para obter o ID correto
      const updatedList = await caller.crmCampaigns.list({});
      expect(updatedList.length).toBeGreaterThan(0);
      const campaignId = updatedList[0].id;
      const result = await caller.crmCampaigns.update({
        id: campaignId,
        templateId: 2,
        subject: "Novo assunto do template",
      });
      expect(result).toEqual({ success: true });
    } else {
      const campaignId = campaigns[0].id;
      const result = await caller.crmCampaigns.update({
        id: campaignId,
        templateId: 2,
        subject: "Novo assunto do template",
      });
      expect(result).toEqual({ success: true });
    }
  });
});

describe("CRM Improvements - Deteção de Duplicados em Tempo Real", () => {
  it("verifica duplicados por email", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar um lead primeiro
    await caller.crmLeads.create({
      name: "Lead Duplicado",
      email: "duplicado-test-rt@exemplo.pt",
      source: "website",
      status: "novo",
    });

    // Verificar duplicados
    const duplicates = await caller.crmDuplicates.check({
      email: "duplicado-test-rt@exemplo.pt",
    });

    expect(duplicates).toBeDefined();
    expect(Array.isArray(duplicates)).toBe(true);
    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].matchType).toBe("email");
    expect(duplicates[0].confidence).toBe("alta");
  });

  it("retorna vazio quando não há duplicados", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const duplicates = await caller.crmDuplicates.check({
      email: "email-unico-nao-existe-xyz@exemplo.pt",
    });

    expect(duplicates).toBeDefined();
    expect(Array.isArray(duplicates)).toBe(true);
    expect(duplicates.length).toBe(0);
  });

  it("exclui lead por ID na verificação", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Usar email único para este teste
    const uniqueEmail = `excluir-test-${Date.now()}@exemplo.pt`;

    // Criar um lead
    const created = await caller.crmLeads.create({
      name: "Lead Excluir",
      email: uniqueEmail,
      source: "website",
      status: "novo",
    });

    const leadId = Number(created.id);
    expect(leadId).toBeGreaterThan(0);

    // Verificar duplicados excluindo o próprio lead
    const duplicates = await caller.crmDuplicates.check({
      email: uniqueEmail,
      excludeId: leadId,
    });

    expect(duplicates).toBeDefined();
    expect(duplicates.length).toBe(0);
  });
});

describe("CRM Improvements - Dashboard de Performance de Workflows", () => {
  it("obtém estatísticas gerais de workflows", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.crmWorkflows.getStats();

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalRules");
    expect(stats).toHaveProperty("activeRules");
    expect(stats).toHaveProperty("totalExecutions");
    expect(stats).toHaveProperty("totalLogs");
    expect(stats).toHaveProperty("successLogs");
    expect(stats).toHaveProperty("failedLogs");
  });

  it("obtém timeline de execuções", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const timeline = await caller.crmWorkflows.getExecutionTimeline({ days: 30 });

    expect(timeline).toBeDefined();
    expect(Array.isArray(timeline)).toBe(true);
  });

  it("obtém top regras mais ativas", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const topRules = await caller.crmWorkflows.getTopRules({ limit: 5 });

    expect(topRules).toBeDefined();
    expect(Array.isArray(topRules)).toBe(true);
  });

  it("obtém taxa de sucesso por tipo de ação", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const rates = await caller.crmWorkflows.getSuccessRateByAction();

    expect(rates).toBeDefined();
    expect(Array.isArray(rates)).toBe(true);
  });

  it("obtém taxa de sucesso por tipo de trigger", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const rates = await caller.crmWorkflows.getSuccessRateByTrigger();

    expect(rates).toBeDefined();
    expect(Array.isArray(rates)).toBe(true);
  });
});
