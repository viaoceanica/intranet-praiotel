import { eq, like, or, desc } from "drizzle-orm";
import { getDb } from "./db";
import { equipment, InsertEquipment, tickets } from "../drizzle/schema";

export async function createEquipment(equipmentData: InsertEquipment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(equipment).values(equipmentData);
  return result;
}

export async function getEquipmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(equipment).where(eq(equipment.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEquipment() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(equipment).orderBy(desc(equipment.createdAt));
  return result;
}

export async function getEquipmentByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(equipment)
    .where(eq(equipment.clientId, clientId))
    .orderBy(desc(equipment.createdAt));
  return result;
}

export async function searchEquipment(query: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(equipment)
    .where(
      or(
        like(equipment.serialNumber, `%${query}%`),
        like(equipment.brand, `%${query}%`),
        like(equipment.model, `%${query}%`)
      )
    )
    .orderBy(desc(equipment.createdAt));

  return result;
}

export async function updateEquipment(id: number, data: Partial<InsertEquipment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(equipment).set(data).where(eq(equipment.id, id));
}

export async function deleteEquipment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(equipment).where(eq(equipment.id, id));
}

/**
 * Obtém histórico de tickets de um equipamento
 */
export async function getEquipmentTicketHistory(equipmentId: number) {
  const db = await getDb();
  if (!db) return [];

  const equipmentData = await getEquipmentById(equipmentId);
  if (!equipmentData) return [];

  // Buscar tickets pelo número de série do equipamento
  const result = await db
    .select()
    .from(tickets)
    .where(like(tickets.equipment, `%${equipmentData.serialNumber}%`))
    .orderBy(desc(tickets.createdAt));

  return result;
}

/**
 * Obtém estatísticas de um equipamento
 */
export async function getEquipmentStats(equipmentId: number) {
  const ticketHistory = await getEquipmentTicketHistory(equipmentId);
  
  const totalTickets = ticketHistory.length;
  const lastIntervention = ticketHistory.length > 0 ? ticketHistory[0].createdAt : null;
  const openTickets = ticketHistory.filter(t => t.status === 'aberto' || t.status === 'em_progresso').length;

  return {
    totalTickets,
    lastIntervention,
    openTickets,
  };
}

/**
 * Obtém lista de equipamentos críticos
 */
export async function getCriticalEquipment() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(equipment)
    .where(eq(equipment.isCritical, 1))
    .orderBy(desc(equipment.createdAt));

  return result;
}
