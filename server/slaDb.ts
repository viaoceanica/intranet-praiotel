import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { slaConfig, InsertSlaConfig } from "../drizzle/schema";

export async function getSlaConfig(priority: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(slaConfig)
    .where(eq(slaConfig.priority, priority as any))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSlaConfigs() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(slaConfig);
  return result;
}

export async function updateSlaConfig(priority: string, data: Partial<InsertSlaConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(slaConfig)
    .set(data)
    .where(eq(slaConfig.priority, priority as any));
}

export async function createSlaConfig(data: InsertSlaConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(slaConfig).values(data);
}

export async function deleteSlaConfig(priority: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(slaConfig)
    .where(eq(slaConfig.priority, priority as any));
}

/**
 * Calcula se um ticket está dentro do SLA
 */
export function calculateSlaStatus(
  createdAt: Date,
  priority: string,
  slaHours: number,
  resolvedAt?: Date | null
): {
  isBreached: boolean;
  hoursElapsed: number;
  hoursRemaining: number;
  percentageUsed: number;
} {
  const now = resolvedAt || new Date();
  const elapsed = now.getTime() - createdAt.getTime();
  const hoursElapsed = elapsed / (1000 * 60 * 60);
  const hoursRemaining = Math.max(0, slaHours - hoursElapsed);
  const percentageUsed = Math.min(100, (hoursElapsed / slaHours) * 100);
  const isBreached = hoursElapsed > slaHours;

  return {
    isBreached,
    hoursElapsed: Math.round(hoursElapsed * 10) / 10,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    percentageUsed: Math.round(percentageUsed),
  };
}
