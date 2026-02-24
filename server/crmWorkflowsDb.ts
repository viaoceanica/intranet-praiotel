import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { crmWorkflowRules, crmWorkflowLogs, crmTasks, crmLeads, crmOpportunities } from "../drizzle/schema";
import * as notificationsDb from "./notificationsDb";

// Tipos de triggers disponíveis
export const TRIGGER_TYPES = [
  { value: "opportunity_stage_change", label: "Mudança de Fase (Oportunidade)", description: "Quando uma oportunidade muda de fase no pipeline" },
  { value: "new_lead", label: "Novo Lead Criado", description: "Quando um novo lead é adicionado ao sistema" },
  { value: "lead_status_change", label: "Mudança de Estado (Lead)", description: "Quando o estado de um lead é alterado" },
  { value: "task_completed", label: "Tarefa Concluída", description: "Quando uma tarefa CRM é marcada como concluída" },
  { value: "lead_score_change", label: "Mudança de Score (Lead)", description: "Quando o score de um lead ultrapassa um limiar" },
];

// Tipos de ações disponíveis
export const ACTION_TYPES = [
  { value: "create_task", label: "Criar Tarefa", description: "Cria automaticamente uma nova tarefa CRM" },
  { value: "send_notification", label: "Enviar Notificação", description: "Envia uma notificação ao utilizador" },
  { value: "change_lead_status", label: "Alterar Estado do Lead", description: "Altera automaticamente o estado de um lead" },
  { value: "assign_user", label: "Atribuir Utilizador", description: "Atribui automaticamente um utilizador" },
  { value: "update_score", label: "Atualizar Score", description: "Adiciona ou subtrai pontos ao score do lead" },
];

/**
 * Listar todas as regras de workflow
 */
export async function listRules(filters?: { active?: boolean; triggerType?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const conditions = [];
  if (filters?.active !== undefined) conditions.push(eq(crmWorkflowRules.active, filters.active ? 1 : 0));
  if (filters?.triggerType) conditions.push(eq(crmWorkflowRules.triggerType, filters.triggerType));

  let query = db.select().from(crmWorkflowRules);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return query.orderBy(crmWorkflowRules.priority, desc(crmWorkflowRules.createdAt));
}

/**
 * Obter regra por ID
 */
export async function getRuleById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select()
    .from(crmWorkflowRules)
    .where(eq(crmWorkflowRules.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Criar nova regra de workflow
 */
export async function createRule(data: {
  name: string;
  description?: string;
  triggerType: string;
  conditions: Record<string, any>;
  actionType: string;
  actionParams: Record<string, any>;
  priority?: number;
  createdById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db.insert(crmWorkflowRules).values({
    name: data.name,
    description: data.description || null,
    triggerType: data.triggerType,
    conditions: JSON.stringify(data.conditions),
    actionType: data.actionType,
    actionParams: JSON.stringify(data.actionParams),
    priority: data.priority || 0,
    createdById: data.createdById,
  });

  return Number((result as any).insertId);
}

/**
 * Atualizar regra de workflow
 */
export async function updateRule(
  id: number,
  data: {
    name?: string;
    description?: string;
    triggerType?: string;
    conditions?: Record<string, any>;
    actionType?: string;
    actionParams?: Record<string, any>;
    active?: boolean;
    priority?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.triggerType !== undefined) updateData.triggerType = data.triggerType;
  if (data.conditions !== undefined) updateData.conditions = JSON.stringify(data.conditions);
  if (data.actionType !== undefined) updateData.actionType = data.actionType;
  if (data.actionParams !== undefined) updateData.actionParams = JSON.stringify(data.actionParams);
  if (data.active !== undefined) updateData.active = data.active ? 1 : 0;
  if (data.priority !== undefined) updateData.priority = data.priority;

  await db
    .update(crmWorkflowRules)
    .set(updateData)
    .where(eq(crmWorkflowRules.id, id));

  return true;
}

/**
 * Eliminar regra de workflow
 */
export async function deleteRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Eliminar logs associados
  await db.delete(crmWorkflowLogs).where(eq(crmWorkflowLogs.ruleId, id));
  // Eliminar regra
  await db.delete(crmWorkflowRules).where(eq(crmWorkflowRules.id, id));

  return true;
}

/**
 * Registar execução de workflow no log
 */
async function logExecution(ruleId: number, triggerData: Record<string, any>, success: boolean, message: string) {
  const db = await getDb();
  if (!db) return;

  await db.insert(crmWorkflowLogs).values({
    ruleId,
    triggerData: JSON.stringify(triggerData),
    success: success ? 1 : 0,
    resultMessage: message,
  });

  // Atualizar contagem de execuções
  await db
    .update(crmWorkflowRules)
    .set({
      executionCount: sql`${crmWorkflowRules.executionCount} + 1`,
      lastExecutedAt: new Date(),
    })
    .where(eq(crmWorkflowRules.id, ruleId));
}

/**
 * Executar ação de criar tarefa
 */
async function executeCreateTask(params: Record<string, any>, context: Record<string, any>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (params.dueDays || 3));

  await db.insert(crmTasks).values({
    title: params.taskTitle || "Tarefa automática",
    description: params.taskDescription || `Tarefa criada automaticamente por workflow`,
    type: params.taskType || "follow_up",
    assignedToId: context.assignedToId || params.assignToId || 1,
    leadId: context.leadId || null,
    opportunityId: context.opportunityId || null,
    clientId: context.clientId || null,
    status: "pendente",
    priority: params.taskPriority || "media",
    dueDate,
  });

  return "Tarefa criada com sucesso";
}

/**
 * Executar ação de enviar notificação
 */
async function executeSendNotification(params: Record<string, any>, context: Record<string, any>) {
  const userId = context.assignedToId || params.notifyUserId;
  if (!userId) return "Nenhum utilizador para notificar";

  await notificationsDb.createNotification({
    userId,
    type: "workflow",
    title: params.notificationTitle || "Notificação de Workflow",
    message: params.notificationMessage || "Uma regra de automação foi ativada.",
  });

  return "Notificação enviada com sucesso";
}

/**
 * Executar ação de alterar estado do lead
 */
async function executeChangeLeadStatus(params: Record<string, any>, context: Record<string, any>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const leadId = context.leadId;
  if (!leadId) return "Nenhum lead no contexto";

  await db
    .update(crmLeads)
    .set({ status: params.newStatus })
    .where(eq(crmLeads.id, leadId));

  return `Estado do lead alterado para ${params.newStatus}`;
}

/**
 * Executar ação de atualizar score
 */
async function executeUpdateScore(params: Record<string, any>, context: Record<string, any>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const leadId = context.leadId;
  if (!leadId) return "Nenhum lead no contexto";

  const pointsChange = params.points || 0;
  await db
    .update(crmLeads)
    .set({ score: sql`GREATEST(0, LEAST(100, ${crmLeads.score} + ${pointsChange}))` })
    .where(eq(crmLeads.id, leadId));

  return `Score atualizado (${pointsChange > 0 ? "+" : ""}${pointsChange} pontos)`;
}

/**
 * Motor principal de execução de workflows
 * Chamado quando um evento acontece no sistema
 */
export async function executeWorkflows(
  triggerType: string,
  context: Record<string, any>
) {
  const db = await getDb();
  if (!db) return [];

  // Buscar regras ativas para este trigger
  const rules = await db
    .select()
    .from(crmWorkflowRules)
    .where(
      and(
        eq(crmWorkflowRules.triggerType, triggerType),
        eq(crmWorkflowRules.active, 1)
      )
    )
    .orderBy(crmWorkflowRules.priority);

  const results: Array<{ ruleId: number; ruleName: string; success: boolean; message: string }> = [];

  for (const rule of rules) {
    try {
      // Verificar condições
      const conditions = JSON.parse(rule.conditions || "{}");
      if (!checkConditions(conditions, context)) {
        continue; // Condições não satisfeitas, saltar
      }

      // Executar ação
      const actionParams = JSON.parse(rule.actionParams || "{}");
      let message = "";

      switch (rule.actionType) {
        case "create_task":
          message = await executeCreateTask(actionParams, context);
          break;
        case "send_notification":
          message = await executeSendNotification(actionParams, context);
          break;
        case "change_lead_status":
          message = await executeChangeLeadStatus(actionParams, context);
          break;
        case "update_score":
          message = await executeUpdateScore(actionParams, context);
          break;
        default:
          message = `Tipo de ação desconhecido: ${rule.actionType}`;
      }

      await logExecution(rule.id, context, true, message);
      results.push({ ruleId: rule.id, ruleName: rule.name, success: true, message });
    } catch (error: any) {
      const errorMsg = error?.message || "Erro desconhecido";
      await logExecution(rule.id, context, false, errorMsg);
      results.push({ ruleId: rule.id, ruleName: rule.name, success: false, message: errorMsg });
    }
  }

  return results;
}

/**
 * Verificar se as condições de uma regra são satisfeitas
 */
function checkConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
  // Se não há condições, a regra aplica-se sempre
  if (!conditions || Object.keys(conditions).length === 0) return true;

  for (const [key, expectedValue] of Object.entries(conditions)) {
    const actualValue = context[key];

    // Condição "any" significa qualquer valor
    if (expectedValue === "any" || expectedValue === "*") continue;

    // Condição de comparação numérica
    if (typeof expectedValue === "object" && expectedValue !== null) {
      if (expectedValue.gte !== undefined && (actualValue === undefined || actualValue < expectedValue.gte)) return false;
      if (expectedValue.lte !== undefined && (actualValue === undefined || actualValue > expectedValue.lte)) return false;
      if (expectedValue.gt !== undefined && (actualValue === undefined || actualValue <= expectedValue.gt)) return false;
      if (expectedValue.lt !== undefined && (actualValue === undefined || actualValue >= expectedValue.lt)) return false;
      continue;
    }

    // Comparação simples
    if (actualValue !== expectedValue) return false;
  }

  return true;
}

/**
 * Obter logs de execução
 */
export async function getExecutionLogs(filters?: { ruleId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  let query = db
    .select({
      log: crmWorkflowLogs,
      rule: crmWorkflowRules,
    })
    .from(crmWorkflowLogs)
    .leftJoin(crmWorkflowRules, eq(crmWorkflowLogs.ruleId, crmWorkflowRules.id));

  if (filters?.ruleId) {
    query = query.where(eq(crmWorkflowLogs.ruleId, filters.ruleId)) as any;
  }

  return query
    .orderBy(desc(crmWorkflowLogs.executedAt))
    .limit(filters?.limit || 50);
}

/**
 * Obter estatísticas de workflows
 */
export async function getWorkflowStats() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select({
      totalRules: sql<number>`COUNT(*)`,
      activeRules: sql<number>`SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END)`,
      totalExecutions: sql<number>`SUM(executionCount)`,
    })
    .from(crmWorkflowRules);

  const logStats = await db
    .select({
      totalLogs: sql<number>`COUNT(*)`,
      successLogs: sql<number>`SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END)`,
      failedLogs: sql<number>`SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END)`,
    })
    .from(crmWorkflowLogs);

  return {
    ...result[0],
    ...logStats[0],
  };
}

/**
 * Obter estatísticas de execuções por dia (últimos 30 dias)
 */
export async function getExecutionTimeline(days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db
    .select({
      date: sql<string>`DATE(executedAt)`,
      total: sql<number>`COUNT(*)`,
      success: sql<number>`SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END)`,
      failed: sql<number>`SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END)`,
    })
    .from(crmWorkflowLogs)
    .where(sql`executedAt >= ${startDate}`)
    .groupBy(sql`DATE(executedAt)`)
    .orderBy(sql`DATE(executedAt)`);

  return results;
}

/**
 * Obter regras mais ativas (top N por execuções)
 */
export async function getTopRules(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db
    .select({
      id: crmWorkflowRules.id,
      name: crmWorkflowRules.name,
      triggerType: crmWorkflowRules.triggerType,
      actionType: crmWorkflowRules.actionType,
      executionCount: crmWorkflowRules.executionCount,
      active: crmWorkflowRules.active,
      lastExecutedAt: crmWorkflowRules.lastExecutedAt,
    })
    .from(crmWorkflowRules)
    .orderBy(desc(crmWorkflowRules.executionCount))
    .limit(limit);
}

/**
 * Obter taxa de sucesso por tipo de ação
 */
export async function getSuccessRateByAction() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db
    .select({
      actionType: crmWorkflowRules.actionType,
      total: sql<number>`COUNT(${crmWorkflowLogs.id})`,
      success: sql<number>`SUM(CASE WHEN ${crmWorkflowLogs.success} = 1 THEN 1 ELSE 0 END)`,
      failed: sql<number>`SUM(CASE WHEN ${crmWorkflowLogs.success} = 0 THEN 1 ELSE 0 END)`,
    })
    .from(crmWorkflowLogs)
    .innerJoin(crmWorkflowRules, eq(crmWorkflowLogs.ruleId, crmWorkflowRules.id))
    .groupBy(crmWorkflowRules.actionType);
}

/**
 * Obter taxa de sucesso por tipo de trigger
 */
export async function getSuccessRateByTrigger() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db
    .select({
      triggerType: crmWorkflowRules.triggerType,
      total: sql<number>`COUNT(${crmWorkflowLogs.id})`,
      success: sql<number>`SUM(CASE WHEN ${crmWorkflowLogs.success} = 1 THEN 1 ELSE 0 END)`,
      failed: sql<number>`SUM(CASE WHEN ${crmWorkflowLogs.success} = 0 THEN 1 ELSE 0 END)`,
    })
    .from(crmWorkflowLogs)
    .innerJoin(crmWorkflowRules, eq(crmWorkflowLogs.ruleId, crmWorkflowRules.id))
    .groupBy(crmWorkflowRules.triggerType);
}
