import { eq, desc, and, gte, lte, sql, or } from "drizzle-orm";
import { getDb } from "./db";
import { crmCampaigns, crmCampaignContacts, crmLeads, clients } from "../drizzle/schema";

/**
 * Listar todas as campanhas com filtros opcionais
 */
export async function listCampaigns(filters?: {
  type?: string;
  status?: string;
  createdById?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  let query = db.select().from(crmCampaigns);

  const conditions = [];
  if (filters?.type) conditions.push(eq(crmCampaigns.type, filters.type as any));
  if (filters?.status) conditions.push(eq(crmCampaigns.status, filters.status as any));
  if (filters?.createdById) conditions.push(eq(crmCampaigns.createdById, filters.createdById));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return query.orderBy(desc(crmCampaigns.createdAt));
}

/**
 * Obter campanha por ID
 */
export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select()
    .from(crmCampaigns)
    .where(eq(crmCampaigns.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Criar nova campanha
 */
export async function createCampaign(data: {
  name: string;
  description?: string;
  type: "email" | "newsletter" | "evento" | "webinar" | "outro";
  status?: "rascunho" | "agendada" | "em_envio" | "enviada" | "cancelada";
  subject?: string;
  emailContent?: string;
  scheduledAt?: Date;
  createdById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db.insert(crmCampaigns).values({
    name: data.name,
    description: data.description || null,
    type: data.type,
    status: data.status || "rascunho",
    subject: data.subject || null,
    emailContent: data.emailContent || null,
    scheduledAt: data.scheduledAt || null,
    createdById: data.createdById,
  });

  return Number((result as any).insertId);
}

/**
 * Atualizar campanha
 */
export async function updateCampaign(
  id: number,
  data: {
    name?: string;
    description?: string;
    type?: "email" | "newsletter" | "evento" | "webinar" | "outro";
    status?: "rascunho" | "agendada" | "em_envio" | "enviada" | "cancelada";
    subject?: string;
    emailContent?: string;
    scheduledAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(crmCampaigns)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(crmCampaigns.id, id));

  return true;
}

/**
 * Eliminar campanha
 */
export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Eliminar contactos da campanha primeiro
  await db.delete(crmCampaignContacts).where(eq(crmCampaignContacts.campaignId, id));

  // Eliminar campanha
  await db.delete(crmCampaigns).where(eq(crmCampaigns.id, id));

  return true;
}

/**
 * Adicionar contactos à campanha
 */
export async function addContactsToCampaign(
  campaignId: number,
  contacts: Array<{ leadId?: number; clientId?: number }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const values = contacts.map((contact) => ({
    campaignId,
    leadId: contact.leadId || null,
    clientId: contact.clientId || null,
    status: "pendente" as const,
  }));

  await db.insert(crmCampaignContacts).values(values);

  // Atualizar totalRecipients
  await db
    .update(crmCampaigns)
    .set({ totalRecipients: contacts.length })
    .where(eq(crmCampaigns.id, campaignId));

  return true;
}

/**
 * Obter contactos de uma campanha
 */
export async function getCampaignContacts(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db
    .select({
      contact: crmCampaignContacts,
      lead: crmLeads,
      client: clients,
    })
    .from(crmCampaignContacts)
    .leftJoin(crmLeads, eq(crmCampaignContacts.leadId, crmLeads.id))
    .leftJoin(clients, eq(crmCampaignContacts.clientId, clients.id))
    .where(eq(crmCampaignContacts.campaignId, campaignId));
}

/**
 * Obter estatísticas de campanhas
 */
export async function getCampaignStats() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select({
      total: sql<number>`COUNT(*)`,
      rascunho: sql<number>`SUM(CASE WHEN status = 'rascunho' THEN 1 ELSE 0 END)`,
      agendada: sql<number>`SUM(CASE WHEN status = 'agendada' THEN 1 ELSE 0 END)`,
      enviada: sql<number>`SUM(CASE WHEN status = 'enviada' THEN 1 ELSE 0 END)`,
      totalRecipients: sql<number>`SUM(totalRecipients)`,
      totalOpened: sql<number>`SUM(openedCount)`,
      totalClicked: sql<number>`SUM(clickedCount)`,
    })
    .from(crmCampaigns);

  return result[0];
}

/**
 * Obter campanhas recentes
 */
export async function getRecentCampaigns(limit: number = 5) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db
    .select()
    .from(crmCampaigns)
    .orderBy(desc(crmCampaigns.createdAt))
    .limit(limit);
}

/**
 * Marcar campanha como enviada
 */
export async function markCampaignAsSent(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(crmCampaigns)
    .set({
      status: "enviada",
      sentAt: new Date(),
    })
    .where(eq(crmCampaigns.id, campaignId));

  return true;
}

/**
 * Atualizar métricas da campanha
 */
export async function updateCampaignMetrics(
  campaignId: number,
  metrics: {
    sentCount?: number;
    openedCount?: number;
    clickedCount?: number;
    bouncedCount?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(crmCampaigns)
    .set(metrics)
    .where(eq(crmCampaigns.id, campaignId));

  return true;
}
