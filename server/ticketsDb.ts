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

export async function getAllTickets() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  return result;
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
