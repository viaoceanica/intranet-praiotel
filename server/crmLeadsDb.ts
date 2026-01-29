import { getDb } from "./db";
import { crmLeads, clients, type InsertCrmLead } from "../drizzle/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

/**
 * Obter todos os leads com filtros opcionais
 */
export async function getAllLeads(filters?: {
  status?: string;
  assignedToId?: number;
  source?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(crmLeads);

  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(crmLeads.status, filters.status as any));
  }

  if (filters?.assignedToId) {
    conditions.push(eq(crmLeads.assignedToId, filters.assignedToId));
  }

  if (filters?.source) {
    conditions.push(eq(crmLeads.source, filters.source));
  }

  if (filters?.search) {
    conditions.push(
      or(
        like(crmLeads.name, `%${filters.search}%`),
        like(crmLeads.company, `%${filters.search}%`),
        like(crmLeads.email, `%${filters.search}%`)
      )!
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)!) as any;
  }

  const leads = await query.orderBy(desc(crmLeads.createdAt));
  return leads;
}

/**
 * Obter lead por ID
 */
export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [lead] = await db
    .select()
    .from(crmLeads)
    .where(eq(crmLeads.id, id));
  return lead;
}

/**
 * Criar novo lead
 */
export async function createLead(data: InsertCrmLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [lead] = await db.insert(crmLeads).values(data).$returningId();
  return lead.id;
}

/**
 * Atualizar lead
 */
export async function updateLead(id: number, data: Partial<InsertCrmLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(crmLeads)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(crmLeads.id, id));
}

/**
 * Eliminar lead
 */
export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(crmLeads).where(eq(crmLeads.id, id));
}

/**
 * Converter lead em oportunidade
 */
export async function convertLeadToOpportunity(
  leadId: number,
  opportunityId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(crmLeads)
    .set({
      status: "convertido",
      convertedToOpportunityId: opportunityId,
      convertedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(crmLeads.id, leadId));
}

/**
 * Converter lead em cliente
 * Cria um novo registo na tabela clients e atualiza o lead
 */
export async function convertLeadToClient(
  leadId: number,
  clientData: {
    designation: string;
    address?: string;
    primaryEmail: string;
    nif: string;
    responsiblePerson?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Criar cliente
  const [newClient] = await db
    .insert(clients)
    .values({
      ...clientData,
      source: "lead",
      leadId: leadId,
    });

  // Atualizar lead
  await db
    .update(crmLeads)
    .set({
      status: "convertido",
      convertedToClientId: newClient.insertId,
      convertedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(crmLeads.id, leadId));

  return newClient.insertId;
}

/**
 * Atualizar score do lead
 */
export async function updateLeadScore(leadId: number, score: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(crmLeads)
    .set({ score, updatedAt: new Date() })
    .where(eq(crmLeads.id, leadId));
}

/**
 * Atualizar data de último contacto
 */
export async function updateLastContacted(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(crmLeads)
    .set({ lastContactedAt: new Date(), updatedAt: new Date() })
    .where(eq(crmLeads.id, leadId));
}

/**
 * Obter estatísticas de leads
 */
export async function getLeadsStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Estatísticas gerais
  const [stats] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      novo: sql<number>`SUM(CASE WHEN ${crmLeads.status} = 'novo' THEN 1 ELSE 0 END)`,
      contactado: sql<number>`SUM(CASE WHEN ${crmLeads.status} = 'contactado' THEN 1 ELSE 0 END)`,
      qualificado: sql<number>`SUM(CASE WHEN ${crmLeads.status} = 'qualificado' THEN 1 ELSE 0 END)`,
      nao_qualificado: sql<number>`SUM(CASE WHEN ${crmLeads.status} = 'nao_qualificado' THEN 1 ELSE 0 END)`,
      convertido: sql<number>`SUM(CASE WHEN ${crmLeads.status} = 'convertido' THEN 1 ELSE 0 END)`,
    })
    .from(crmLeads);

  // Leads por origem
  const bySourceResults = await db
    .select({
      source: crmLeads.source,
      count: sql<number>`COUNT(*)`,
    })
    .from(crmLeads)
    .groupBy(crmLeads.source);

  const bySource: Record<string, number> = {};
  bySourceResults.forEach((row) => {
    if (row.source) bySource[row.source] = row.count;
  });

  return {
    ...stats,
    byStatus: {
      novo: stats.novo,
      contactado: stats.contactado,
      qualificado: stats.qualificado,
      nao_qualificado: stats.nao_qualificado,
      convertido: stats.convertido,
    },
    bySource,
  };
}

/**
 * Obter leads por vendedor
 */
export async function getLeadsByAssignee(assignedToId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const leads = await db
    .select()
    .from(crmLeads)
    .where(eq(crmLeads.assignedToId, assignedToId))
    .orderBy(desc(crmLeads.createdAt));
  return leads;
}

/**
 * Atribuir lead a vendedor
 */
export async function assignLead(leadId: number, assignedToId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(crmLeads)
    .set({ assignedToId, updatedAt: new Date() })
    .where(eq(crmLeads.id, leadId));
}
