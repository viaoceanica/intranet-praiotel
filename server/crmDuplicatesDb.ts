import { eq, desc, and, sql, or, like } from "drizzle-orm";
import { getDb } from "./db";
import { crmLeads, crmActivities, crmOpportunities } from "../drizzle/schema";

export interface DuplicateGroup {
  matchType: "email" | "phone" | "name_company";
  matchValue: string;
  leads: Array<{
    id: number;
    name: string;
    company: string | null;
    email: string;
    phone: string | null;
    status: string;
    score: number;
    source: string;
    createdAt: Date;
    activitiesCount?: number;
    opportunitiesCount?: number;
  }>;
  confidence: "alta" | "media" | "baixa";
}

/**
 * Encontrar leads duplicados por email
 */
async function findDuplicatesByEmail(): Promise<DuplicateGroup[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Encontrar emails que aparecem mais de uma vez
  const duplicateEmails = await db
    .select({
      email: crmLeads.email,
      count: sql<number>`COUNT(*)`,
    })
    .from(crmLeads)
    .groupBy(crmLeads.email)
    .having(sql`COUNT(*) > 1`);

  const groups: DuplicateGroup[] = [];

  for (const dup of duplicateEmails) {
    const leads = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.email, dup.email));

    groups.push({
      matchType: "email",
      matchValue: dup.email,
      leads: leads.map((l) => ({
        id: l.id,
        name: l.name,
        company: l.company,
        email: l.email,
        phone: l.phone,
        status: l.status,
        score: l.score,
        source: l.source,
        createdAt: l.createdAt,
      })),
      confidence: "alta",
    });
  }

  return groups;
}

/**
 * Encontrar leads duplicados por telefone
 */
async function findDuplicatesByPhone(): Promise<DuplicateGroup[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const duplicatePhones = await db
    .select({
      phone: crmLeads.phone,
      count: sql<number>`COUNT(*)`,
    })
    .from(crmLeads)
    .where(sql`${crmLeads.phone} IS NOT NULL AND ${crmLeads.phone} != ''`)
    .groupBy(crmLeads.phone)
    .having(sql`COUNT(*) > 1`);

  const groups: DuplicateGroup[] = [];

  for (const dup of duplicatePhones) {
    if (!dup.phone) continue;
    
    const leads = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.phone, dup.phone));

    groups.push({
      matchType: "phone",
      matchValue: dup.phone,
      leads: leads.map((l) => ({
        id: l.id,
        name: l.name,
        company: l.company,
        email: l.email,
        phone: l.phone,
        status: l.status,
        score: l.score,
        source: l.source,
        createdAt: l.createdAt,
      })),
      confidence: "alta",
    });
  }

  return groups;
}

/**
 * Encontrar leads duplicados por nome + empresa
 */
async function findDuplicatesByNameCompany(): Promise<DuplicateGroup[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const duplicates = await db
    .select({
      name: crmLeads.name,
      company: crmLeads.company,
      count: sql<number>`COUNT(*)`,
    })
    .from(crmLeads)
    .where(sql`${crmLeads.company} IS NOT NULL AND ${crmLeads.company} != ''`)
    .groupBy(crmLeads.name, crmLeads.company)
    .having(sql`COUNT(*) > 1`);

  const groups: DuplicateGroup[] = [];

  for (const dup of duplicates) {
    if (!dup.company) continue;

    const leads = await db
      .select()
      .from(crmLeads)
      .where(
        and(
          eq(crmLeads.name, dup.name),
          eq(crmLeads.company, dup.company)
        )
      );

    // Verificar se não é já coberto por email duplicado
    const uniqueEmails = new Set(leads.map((l) => l.email));
    if (uniqueEmails.size === 1) continue; // Mesmo email = já coberto

    groups.push({
      matchType: "name_company",
      matchValue: `${dup.name} @ ${dup.company}`,
      leads: leads.map((l) => ({
        id: l.id,
        name: l.name,
        company: l.company,
        email: l.email,
        phone: l.phone,
        status: l.status,
        score: l.score,
        source: l.source,
        createdAt: l.createdAt,
      })),
      confidence: "media",
    });
  }

  return groups;
}

/**
 * Encontrar todos os duplicados
 */
export async function findAllDuplicates(): Promise<DuplicateGroup[]> {
  const [byEmail, byPhone, byNameCompany] = await Promise.all([
    findDuplicatesByEmail(),
    findDuplicatesByPhone(),
    findDuplicatesByNameCompany(),
  ]);

  // Combinar e remover duplicados de grupos
  const allGroups = [...byEmail, ...byPhone, ...byNameCompany];

  // Remover grupos que contenham os mesmos leads (já cobertos por outro critério)
  const seen = new Set<string>();
  const uniqueGroups: DuplicateGroup[] = [];

  for (const group of allGroups) {
    const key = group.leads
      .map((l) => l.id)
      .sort()
      .join(",");
    if (!seen.has(key)) {
      seen.add(key);
      uniqueGroups.push(group);
    }
  }

  return uniqueGroups;
}

/**
 * Verificar se um lead específico tem duplicados (para verificação na criação)
 */
export async function checkForDuplicates(data: {
  email: string;
  phone?: string;
  name?: string;
  company?: string;
  excludeId?: number;
}): Promise<Array<{ lead: any; matchType: string; confidence: string }>> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const matches: Array<{ lead: any; matchType: string; confidence: string }> = [];

  // Verificar por email (confiança alta)
  if (data.email) {
    let emailQuery = db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.email, data.email));

    const emailMatches = await emailQuery;
    for (const lead of emailMatches) {
      if (data.excludeId && lead.id === data.excludeId) continue;
      matches.push({ lead, matchType: "email", confidence: "alta" });
    }
  }

  // Verificar por telefone (confiança alta)
  if (data.phone) {
    const phoneMatches = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.phone, data.phone));

    for (const lead of phoneMatches) {
      if (data.excludeId && lead.id === data.excludeId) continue;
      if (matches.some((m) => m.lead.id === lead.id)) continue;
      matches.push({ lead, matchType: "telefone", confidence: "alta" });
    }
  }

  // Verificar por nome + empresa (confiança média)
  if (data.name && data.company) {
    const nameMatches = await db
      .select()
      .from(crmLeads)
      .where(
        and(
          eq(crmLeads.name, data.name),
          eq(crmLeads.company, data.company)
        )
      );

    for (const lead of nameMatches) {
      if (data.excludeId && lead.id === data.excludeId) continue;
      if (matches.some((m) => m.lead.id === lead.id)) continue;
      matches.push({ lead, matchType: "nome+empresa", confidence: "media" });
    }
  }

  return matches;
}

/**
 * Fundir dois leads (manter o principal, transferir dados do secundário)
 */
export async function mergeLeads(primaryId: number, secondaryId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Obter ambos os leads
  const [primary] = await db.select().from(crmLeads).where(eq(crmLeads.id, primaryId)).limit(1);
  const [secondary] = await db.select().from(crmLeads).where(eq(crmLeads.id, secondaryId)).limit(1);

  if (!primary || !secondary) throw new Error("Lead não encontrado");

  // Preencher campos vazios do primário com dados do secundário
  const updateData: Record<string, any> = {};
  if (!primary.phone && secondary.phone) updateData.phone = secondary.phone;
  if (!primary.company && secondary.company) updateData.company = secondary.company;
  if (!primary.jobTitle && secondary.jobTitle) updateData.jobTitle = secondary.jobTitle;
  if (!primary.budget && secondary.budget) updateData.budget = secondary.budget;
  if (!primary.timeline && secondary.timeline) updateData.timeline = secondary.timeline;
  if (!primary.needs && secondary.needs) updateData.needs = secondary.needs;

  // Usar o score mais alto
  if (secondary.score > primary.score) updateData.score = secondary.score;

  // Combinar notas
  if (secondary.notes) {
    updateData.notes = (primary.notes || "") + "\n\n--- Notas do lead fundido (#" + secondaryId + ") ---\n" + secondary.notes;
  }

  // Atualizar o lead primário
  if (Object.keys(updateData).length > 0) {
    await db.update(crmLeads).set(updateData).where(eq(crmLeads.id, primaryId));
  }

  // Transferir atividades do secundário para o primário
  await db
    .update(crmActivities)
    .set({ leadId: primaryId })
    .where(eq(crmActivities.leadId, secondaryId));

  // Transferir oportunidades do secundário para o primário
  await db
    .update(crmOpportunities)
    .set({ leadId: primaryId })
    .where(eq(crmOpportunities.leadId, secondaryId));

  // Eliminar o lead secundário
  await db.delete(crmLeads).where(eq(crmLeads.id, secondaryId));

  return true;
}

/**
 * Obter estatísticas de duplicados
 */
export async function getDuplicateStats() {
  const groups = await findAllDuplicates();

  return {
    totalGroups: groups.length,
    totalDuplicateLeads: groups.reduce((sum, g) => sum + g.leads.length, 0),
    byType: {
      email: groups.filter((g) => g.matchType === "email").length,
      phone: groups.filter((g) => g.matchType === "phone").length,
      name_company: groups.filter((g) => g.matchType === "name_company").length,
    },
    byConfidence: {
      alta: groups.filter((g) => g.confidence === "alta").length,
      media: groups.filter((g) => g.confidence === "media").length,
      baixa: groups.filter((g) => g.confidence === "baixa").length,
    },
  };
}
