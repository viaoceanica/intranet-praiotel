import { eq, desc, and, or, like } from "drizzle-orm";
import { getDb } from "./db";
import { tickets, attachments, ticketHistory, InsertTicket, InsertAttachment, InsertTicketHistory } from "../drizzle/schema";

export async function createTicket(ticket: InsertTicket) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tickets).values(ticket);
  return result;
}

export async function getTicketById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTicketByNumber(ticketNumber: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tickets).where(eq(tickets.ticketNumber, ticketNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllTickets() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  return result;
}

export async function getTicketsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(tickets)
    .where(eq(tickets.clientId, clientId))
    .orderBy(desc(tickets.createdAt));
  return result;
}

export async function getClientTicketStats(clientId: number) {
  const db = await getDb();
  if (!db) return null;

  const allTickets = await getTicketsByClientId(clientId);
  const total = allTickets.length;
  const abertos = allTickets.filter(t => t.status === 'aberto').length;
  const emProgresso = allTickets.filter(t => t.status === 'em_progresso').length;
  const resolvidos = allTickets.filter(t => t.status === 'resolvido').length;
  const fechados = allTickets.filter(t => t.status === 'fechado').length;

  // Calcular tempo médio de resolução (apenas tickets resolvidos/fechados)
  const resolvedTickets = allTickets.filter(t => t.resolvedAt);
  let avgResolutionTime = 0;
  if (resolvedTickets.length > 0) {
    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      const created = new Date(ticket.createdAt).getTime();
      const resolved = new Date(ticket.resolvedAt!).getTime();
      return sum + (resolved - created);
    }, 0);
    avgResolutionTime = totalTime / resolvedTickets.length;
  }

  return {
    total,
    abertos,
    emProgresso,
    resolvidos,
    fechados,
    avgResolutionTimeMs: avgResolutionTime,
  };
}

export async function updateTicket(id: number, data: Partial<InsertTicket>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tickets).set(data).where(eq(tickets.id, id));
}

export async function deleteTicket(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(tickets).where(eq(tickets.id, id));
}

export async function getTicketAttachments(ticketId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(attachments).where(eq(attachments.ticketId, ticketId));
  return result;
}

export async function createAttachment(attachment: InsertAttachment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(attachments).values(attachment);
  return result;
}

export async function deleteAttachment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(attachments).where(eq(attachments.id, id));
}

export async function createTicketHistory(history: InsertTicketHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(ticketHistory).values(history);
}

export async function getTicketHistory(ticketId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(ticketHistory).where(eq(ticketHistory.ticketId, ticketId)).orderBy(desc(ticketHistory.createdAt));
  return result;
}

/**
 * Calcula métricas de cumprimento de SLA
 */
export async function getSlaMetrics() {
  const db = await getDb();
  if (!db) return null;

  const allTickets = await getAllTickets();
  const { getAllSlaConfigs } = await import('./slaDb');
  const slaConfigs = await getAllSlaConfigs();

  let totalTickets = 0;
  let ticketsWithinSla = 0;
  let ticketsBreachedSla = 0;
  let totalBreachHours = 0;
  let breachCount = 0;

  for (const ticket of allTickets) {
    const slaConfig = slaConfigs.find(c => c.priority === ticket.priority);
    if (!slaConfig) continue;

    totalTickets++;

    const resolvedDate = ticket.resolvedAt || ticket.closedAt;
    if (!resolvedDate) continue; // Apenas tickets resolvidos/fechados

    const elapsed = resolvedDate.getTime() - ticket.createdAt.getTime();
    const hoursElapsed = elapsed / (1000 * 60 * 60);
    const slaHours = slaConfig.resolutionTimeHours;

    if (hoursElapsed <= slaHours) {
      ticketsWithinSla++;
    } else {
      ticketsBreachedSla++;
      totalBreachHours += (hoursElapsed - slaHours);
      breachCount++;
    }
  }

  const slaCompliancePercentage = totalTickets > 0 
    ? Math.round((ticketsWithinSla / totalTickets) * 100) 
    : 0;

  const averageBreachHours = breachCount > 0 
    ? Math.round((totalBreachHours / breachCount) * 10) / 10 
    : 0;

  return {
    totalTickets,
    ticketsWithinSla,
    ticketsBreachedSla,
    slaCompliancePercentage,
    averageBreachHours,
  };
}

/**
 * Obtém ranking de técnicos por cumprimento de SLA
 */
export async function getTechnicianSlaRanking() {
  const db = await getDb();
  if (!db) return [];

  const allTickets = await getAllTickets();
  const { getAllSlaConfigs } = await import('./slaDb');
  const slaConfigs = await getAllSlaConfigs();

  const technicianStats: Record<number, { name: string; total: number; withinSla: number; breached: number }> = {};

  for (const ticket of allTickets) {
    if (!ticket.assignedToId) continue;

    const resolvedDate = ticket.resolvedAt || ticket.closedAt;
    if (!resolvedDate) continue;

    const slaConfig = slaConfigs.find(c => c.priority === ticket.priority);
    if (!slaConfig) continue;

    if (!technicianStats[ticket.assignedToId]) {
      technicianStats[ticket.assignedToId] = {
        name: '', // Será preenchido depois
        total: 0,
        withinSla: 0,
        breached: 0,
      };
    }

    const elapsed = resolvedDate.getTime() - ticket.createdAt.getTime();
    const hoursElapsed = elapsed / (1000 * 60 * 60);
    const slaHours = slaConfig.resolutionTimeHours;

    technicianStats[ticket.assignedToId].total++;

    if (hoursElapsed <= slaHours) {
      technicianStats[ticket.assignedToId].withinSla++;
    } else {
      technicianStats[ticket.assignedToId].breached++;
    }
  }

  return Object.entries(technicianStats).map(([techId, stats]) => ({
    technicianId: Number(techId),
    ...stats,
    compliancePercentage: stats.total > 0 ? Math.round((stats.withinSla / stats.total) * 100) : 0,
  })).sort((a, b) => b.compliancePercentage - a.compliancePercentage);
}

export async function generateTicketNumber() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const year = new Date().getFullYear();
  const prefix = `TK${year}`;
  
  const lastTicket = await db
    .select()
    .from(tickets)
    .where(like(tickets.ticketNumber, `${prefix}%`))
    .orderBy(desc(tickets.ticketNumber))
    .limit(1);

  if (lastTicket.length === 0) {
    return `${prefix}-0001`;
  }

  const lastNumber = parseInt(lastTicket[0].ticketNumber.split('-')[1]);
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
  return `${prefix}-${nextNumber}`;
}
