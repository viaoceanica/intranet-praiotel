import { getDb } from "./db";
import { crmLeads, crmActivities, crmOpportunities } from "../drizzle/schema";
import { eq, sql, and, gte, count } from "drizzle-orm";

/**
 * Regras de Lead Scoring padrão (armazenadas em memória, sem tabela extra)
 * Cada regra tem: campo, condição, valor, pontos
 */
export interface LeadScoringRule {
  id: string;
  name: string;
  description: string;
  field: string;
  condition: "equals" | "not_empty" | "greater_than" | "contains" | "activity_count" | "has_opportunity";
  value: string;
  points: number;
  active: boolean;
}

// Regras padrão de Lead Scoring
const DEFAULT_SCORING_RULES: LeadScoringRule[] = [
  {
    id: "has_email",
    name: "Tem email",
    description: "Lead tem endereço de email preenchido",
    field: "email",
    condition: "not_empty",
    value: "",
    points: 10,
    active: true,
  },
  {
    id: "has_phone",
    name: "Tem telefone",
    description: "Lead tem número de telefone preenchido",
    field: "phone",
    condition: "not_empty",
    value: "",
    points: 10,
    active: true,
  },
  {
    id: "has_company",
    name: "Tem empresa",
    description: "Lead tem nome de empresa preenchido",
    field: "company",
    condition: "not_empty",
    value: "",
    points: 10,
    active: true,
  },
  {
    id: "has_budget",
    name: "Tem orçamento",
    description: "Lead tem orçamento definido",
    field: "budget",
    condition: "not_empty",
    value: "",
    points: 15,
    active: true,
  },
  {
    id: "has_needs",
    name: "Necessidades identificadas",
    description: "Lead tem necessidades preenchidas",
    field: "needs",
    condition: "not_empty",
    value: "",
    points: 10,
    active: true,
  },
  {
    id: "has_timeline",
    name: "Tem prazo definido",
    description: "Lead tem prazo para decisão",
    field: "timeline",
    condition: "not_empty",
    value: "",
    points: 10,
    active: true,
  },
  {
    id: "status_qualified",
    name: "Lead qualificado",
    description: "Lead foi marcado como qualificado",
    field: "status",
    condition: "equals",
    value: "qualificado",
    points: 20,
    active: true,
  },
  {
    id: "status_contacted",
    name: "Lead contactado",
    description: "Lead foi contactado",
    field: "status",
    condition: "equals",
    value: "contactado",
    points: 10,
    active: true,
  },
  {
    id: "has_activities",
    name: "Tem interações",
    description: "Lead tem pelo menos 1 atividade registada",
    field: "activities",
    condition: "activity_count",
    value: "1",
    points: 15,
    active: true,
  },
  {
    id: "has_opportunity",
    name: "Tem oportunidade",
    description: "Lead tem oportunidade de venda associada",
    field: "opportunity",
    condition: "has_opportunity",
    value: "",
    points: 20,
    active: true,
  },
];

// In-memory storage for custom rules (persisted per session)
let customRules: LeadScoringRule[] | null = null;

/**
 * Obter as regras de scoring atuais
 */
export function getScoringRules(): LeadScoringRule[] {
  return customRules || DEFAULT_SCORING_RULES;
}

/**
 * Atualizar regras de scoring
 */
export function updateScoringRules(rules: LeadScoringRule[]): void {
  customRules = rules;
}

/**
 * Resetar para regras padrão
 */
export function resetScoringRules(): void {
  customRules = null;
}

/**
 * Calcular o score de um lead individual
 */
export async function calculateLeadScore(leadId: number): Promise<{
  score: number;
  maxScore: number;
  breakdown: Array<{ rule: string; points: number; matched: boolean }>;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar o lead
  const [lead] = await db.select().from(crmLeads).where(eq(crmLeads.id, leadId));
  if (!lead) throw new Error("Lead not found");

  // Contar atividades do lead
  const [activityCount] = await db
    .select({ count: count() })
    .from(crmActivities)
    .where(eq(crmActivities.leadId, leadId));

  // Verificar se tem oportunidade
  const [opportunityCount] = await db
    .select({ count: count() })
    .from(crmOpportunities)
    .where(eq(crmOpportunities.leadId, leadId));

  const rules = getScoringRules().filter(r => r.active);
  let totalScore = 0;
  const maxScore = rules.reduce((sum, r) => sum + r.points, 0);
  const breakdown: Array<{ rule: string; points: number; matched: boolean }> = [];

  for (const rule of rules) {
    let matched = false;

    switch (rule.condition) {
      case "not_empty":
        matched = !!(lead as any)[rule.field] && (lead as any)[rule.field] !== "";
        break;
      case "equals":
        matched = (lead as any)[rule.field] === rule.value;
        break;
      case "greater_than":
        matched = parseFloat((lead as any)[rule.field] || "0") > parseFloat(rule.value);
        break;
      case "contains":
        matched = ((lead as any)[rule.field] || "").toLowerCase().includes(rule.value.toLowerCase());
        break;
      case "activity_count":
        matched = (activityCount?.count || 0) >= parseInt(rule.value);
        break;
      case "has_opportunity":
        matched = (opportunityCount?.count || 0) > 0;
        break;
    }

    if (matched) {
      totalScore += rule.points;
    }

    breakdown.push({
      rule: rule.name,
      points: rule.points,
      matched,
    });
  }

  // Normalizar para 0-100
  const normalizedScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    score: normalizedScore,
    maxScore: 100,
    breakdown,
  };
}

/**
 * Recalcular scores de todos os leads
 */
export async function recalculateAllLeadScores(): Promise<{
  updated: number;
  errors: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allLeads = await db.select({ id: crmLeads.id }).from(crmLeads);
  let updated = 0;
  let errors = 0;

  for (const lead of allLeads) {
    try {
      const { score } = await calculateLeadScore(lead.id);
      await db
        .update(crmLeads)
        .set({ score })
        .where(eq(crmLeads.id, lead.id));
      updated++;
    } catch (e) {
      errors++;
    }
  }

  return { updated, errors };
}

/**
 * Obter distribuição de scores
 */
export async function getScoreDistribution(): Promise<Array<{ range: string; count: number }>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const distribution = await db
    .select({
      range: sql<string>`
        CASE 
          WHEN ${crmLeads.score} >= 80 THEN 'Quente (80-100)'
          WHEN ${crmLeads.score} >= 60 THEN 'Morno (60-79)'
          WHEN ${crmLeads.score} >= 40 THEN 'Frio (40-59)'
          WHEN ${crmLeads.score} >= 20 THEN 'Muito Frio (20-39)'
          ELSE 'Sem Score (0-19)'
        END
      `,
      count: count(),
    })
    .from(crmLeads)
    .groupBy(sql`
      CASE 
        WHEN ${crmLeads.score} >= 80 THEN 'Quente (80-100)'
        WHEN ${crmLeads.score} >= 60 THEN 'Morno (60-79)'
        WHEN ${crmLeads.score} >= 40 THEN 'Frio (40-59)'
        WHEN ${crmLeads.score} >= 20 THEN 'Muito Frio (20-39)'
        ELSE 'Sem Score (0-19)'
      END
    `);

  return distribution;
}
