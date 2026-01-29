import { getDb } from "./db";
import { crmOpportunities, crmOpportunityHistory, type InsertCrmOpportunity } from "../drizzle/schema";
import { eq, desc, and, or, like, sql, gte, lte } from "drizzle-orm";

/**
 * Obter todas as oportunidades com filtros opcionais
 */
export async function getAllOpportunities(filters?: {
  stage?: string;
  assignedToId?: number;
  clientId?: number;
  search?: string;
  minValue?: number;
  maxValue?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(crmOpportunities);

  const conditions = [];

  if (filters?.stage) {
    conditions.push(eq(crmOpportunities.stage, filters.stage as any));
  }

  if (filters?.assignedToId) {
    conditions.push(eq(crmOpportunities.assignedToId, filters.assignedToId));
  }

  if (filters?.clientId) {
    conditions.push(eq(crmOpportunities.clientId, filters.clientId));
  }

  if (filters?.search) {
    conditions.push(
      or(
        like(crmOpportunities.title, `%${filters.search}%`),
        like(crmOpportunities.description, `%${filters.search}%`)
      )!
    );
  }

  if (filters?.minValue !== undefined) {
    conditions.push(gte(crmOpportunities.value, filters.minValue.toString()));
  }

  if (filters?.maxValue !== undefined) {
    conditions.push(lte(crmOpportunities.value, filters.maxValue.toString()));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)!) as any;
  }

  const opportunities = await query.orderBy(desc(crmOpportunities.createdAt));
  return opportunities;
}

/**
 * Obter oportunidade por ID
 */
export async function getOpportunityById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [opportunity] = await db
    .select()
    .from(crmOpportunities)
    .where(eq(crmOpportunities.id, id));
  return opportunity;
}

/**
 * Criar nova oportunidade
 */
export async function createOpportunity(data: InsertCrmOpportunity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [opportunity] = await db.insert(crmOpportunities).values(data).$returningId();
  
  // Registar no histórico
  await addOpportunityHistory(opportunity.id, data.stage || "prospeccao", "Oportunidade criada");
  
  return opportunity.id;
}

/**
 * Atualizar oportunidade
 */
export async function updateOpportunity(id: number, data: Partial<InsertCrmOpportunity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Se o stage mudou, registar no histórico
  if (data.stage) {
    const current = await getOpportunityById(id);
    if (current && current.stage !== data.stage) {
      await addOpportunityHistory(id, data.stage, `Mudou de ${current.stage} para ${data.stage}`, current.stage);
    }
  }

  await db
    .update(crmOpportunities)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(crmOpportunities.id, id));
}

/**
 * Eliminar oportunidade
 */
export async function deleteOpportunity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(crmOpportunities).where(eq(crmOpportunities.id, id));
}

/**
 * Mover oportunidade para nova fase (stage)
 */
export async function moveOpportunityStage(id: number, newStage: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const current = await getOpportunityById(id);
  if (!current) throw new Error("Opportunity not found");

  await db
    .update(crmOpportunities)
    .set({ stage: newStage as any, updatedAt: new Date() })
    .where(eq(crmOpportunities.id, id));

  await addOpportunityHistory(
    id,
    newStage,
    notes || `Movido de ${current.stage} para ${newStage}`
  );
}

/**
 * Converter oportunidade em cliente
 */
export async function convertOpportunityToClient(opportunityId: number, clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(crmOpportunities)
    .set({
      status: "ganha",
      actualCloseDate: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(crmOpportunities.id, opportunityId));

  await addOpportunityHistory(opportunityId, "fechamento", "Oportunidade convertida em cliente");
}

/**
 * Marcar oportunidade como perdida
 */
export async function markOpportunityAsLost(id: number, lostReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(crmOpportunities)
    .set({
      status: "perdida",
      lostReason,
      actualCloseDate: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(crmOpportunities.id, id));

  await addOpportunityHistory(id, "fechamento", lostReason || "Oportunidade marcada como perdida");
}

/**
 * Adicionar entrada ao histórico da oportunidade
 */
export async function addOpportunityHistory(
  opportunityId: number,
  toStage: string,
  notes: string,
  fromStage?: string,
  changedById?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(crmOpportunityHistory).values({
    opportunityId,
    toStage: toStage as any,
    fromStage: fromStage as any,
    notes,
    changedById: changedById || 1, // TODO: usar ID do utilizador atual
    createdAt: new Date(),
  });
}

/**
 * Obter histórico da oportunidade
 */
export async function getOpportunityHistory(opportunityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const history = await db
    .select()
    .from(crmOpportunityHistory)
    .where(eq(crmOpportunityHistory.opportunityId, opportunityId))
    .orderBy(desc(crmOpportunityHistory.createdAt));

  return history;
}

/**
 * Obter estatísticas de oportunidades
 */
export async function getOpportunitiesStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [stats] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      prospeccao: sql<number>`SUM(CASE WHEN ${crmOpportunities.stage} = 'prospeccao' THEN 1 ELSE 0 END)`,
      qualificacao: sql<number>`SUM(CASE WHEN ${crmOpportunities.stage} = 'qualificacao' THEN 1 ELSE 0 END)`,
      proposta: sql<number>`SUM(CASE WHEN ${crmOpportunities.stage} = 'proposta' THEN 1 ELSE 0 END)`,
      negociacao: sql<number>`SUM(CASE WHEN ${crmOpportunities.stage} = 'negociacao' THEN 1 ELSE 0 END)`,
      fechamento: sql<number>`SUM(CASE WHEN ${crmOpportunities.stage} = 'fechamento' THEN 1 ELSE 0 END)`,
      ganha: sql<number>`SUM(CASE WHEN ${crmOpportunities.stage} = 'ganha' THEN 1 ELSE 0 END)`,
      perdida: sql<number>`SUM(CASE WHEN ${crmOpportunities.stage} = 'perdida' THEN 1 ELSE 0 END)`,
      totalValue: sql<number>`SUM(CASE WHEN ${crmOpportunities.status} = 'aberta' THEN CAST(${crmOpportunities.value} AS DECIMAL(10,2)) ELSE 0 END)`,
      wonValue: sql<number>`SUM(CASE WHEN ${crmOpportunities.stage} = 'ganha' THEN CAST(${crmOpportunities.value} AS DECIMAL(10,2)) ELSE 0 END)`,
    })
    .from(crmOpportunities);

  return stats;
}

/**
 * Obter oportunidades por vendedor
 */
export async function getOpportunitiesByAssignee(assignedToId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const opportunities = await db
    .select()
    .from(crmOpportunities)
    .where(eq(crmOpportunities.assignedToId, assignedToId))
    .orderBy(desc(crmOpportunities.createdAt));

  return opportunities;
}

/**
 * Atribuir oportunidade a vendedor
 */
export async function assignOpportunity(opportunityId: number, assignedToId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(crmOpportunities)
    .set({ assignedToId, updatedAt: new Date() })
    .where(eq(crmOpportunities.id, opportunityId));
}

/**
 * Calcular taxa de conversão
 */
export async function getConversionRate() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      won: sql<number>`SUM(CASE WHEN ${crmOpportunities.stage} = 'ganha' THEN 1 ELSE 0 END)`,
    })
    .from(crmOpportunities);

  const rate = result.total > 0 ? (result.won / result.total) * 100 : 0;
  return { total: result.total, won: result.won, rate };
}
