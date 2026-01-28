import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { prioritizationRules, priorityChangeLog, InsertPrioritizationRule, InsertPriorityChangeLog } from "../drizzle/schema";

export async function createRule(ruleData: InsertPrioritizationRule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(prioritizationRules).values(ruleData);
  return result;
}

export async function getAllRules() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(prioritizationRules).orderBy(desc(prioritizationRules.createdAt));
  return result;
}

export async function getActiveRules() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(prioritizationRules)
    .where(eq(prioritizationRules.active, 1))
    .orderBy(desc(prioritizationRules.createdAt));

  return result;
}

export async function updateRule(id: number, data: Partial<InsertPrioritizationRule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(prioritizationRules).set(data).where(eq(prioritizationRules.id, id));
}

export async function deleteRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(prioritizationRules).where(eq(prioritizationRules.id, id));
}

export async function logPriorityChange(logData: InsertPriorityChangeLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(priorityChangeLog).values(logData);
  return result;
}

export async function getPriorityChangesByTicket(ticketId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(priorityChangeLog)
    .where(eq(priorityChangeLog.ticketId, ticketId))
    .orderBy(desc(priorityChangeLog.createdAt));

  return result;
}

/**
 * Aplica regras de priorização automática a um ticket
 */
export async function applyAutoPrioritization(ticketData: {
  clientId?: number;
  equipment: string;
  description: string;
  problemType: string;
  currentPriority: string;
}): Promise<{ newPriority: string; reason: string; ruleId?: number } | null> {
  const rules = await getActiveRules();
  const { getClientById } = await import('./clientsDb');
  const { getAllEquipment } = await import('./equipmentDb');

  for (const rule of rules) {
    const condition = JSON.parse(rule.condition);

    switch (rule.ruleType) {
      case 'vip_client': {
        if (ticketData.clientId) {
          const client = await getClientById(ticketData.clientId);
          if (client && condition.vipClientIds && condition.vipClientIds.includes(ticketData.clientId)) {
            return {
              newPriority: rule.targetPriority,
              reason: `Cliente VIP: ${client.designation}`,
              ruleId: rule.id,
            };
          }
        }
        break;
      }

      case 'critical_equipment': {
        const allEquipment = await getAllEquipment();
        const criticalEquip = allEquipment.find(
          e => e.isCritical === 1 && ticketData.equipment.includes(e.serialNumber)
        );
        if (criticalEquip) {
          return {
            newPriority: rule.targetPriority,
            reason: `Equipamento crítico: ${criticalEquip.brand} ${criticalEquip.model}`,
            ruleId: rule.id,
          };
        }
        break;
      }

      case 'keyword': {
        const keywords = condition.keywords || [];
        const text = `${ticketData.description} ${ticketData.problemType}`.toLowerCase();
        const foundKeyword = keywords.find((kw: string) => text.includes(kw.toLowerCase()));
        if (foundKeyword) {
          return {
            newPriority: rule.targetPriority,
            reason: `Palavra-chave detectada: "${foundKeyword}"`,
            ruleId: rule.id,
          };
        }
        break;
      }

      // time_elapsed será aplicado posteriormente, após criação do ticket
    }
  }

  return null;
}
