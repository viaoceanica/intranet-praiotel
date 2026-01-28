import { eq, or, like, desc } from "drizzle-orm";
import { getDb } from "./db";
import { clients, clientEmails, InsertClient, InsertClientEmail } from "../drizzle/schema";

export async function createClient(client: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clients).values(client);
  return result;
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllClients() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(clients).orderBy(desc(clients.createdAt));
  return result;
}

export async function searchClients(query: string) {
  const db = await getDb();
  if (!db) return [];

  const searchPattern = `%${query}%`;
  const result = await db
    .select()
    .from(clients)
    .where(
      or(
        like(clients.designation, searchPattern),
        like(clients.nif, searchPattern),
        like(clients.primaryEmail, searchPattern)
      )
    )
    .orderBy(desc(clients.createdAt));

  return result;
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Eliminar emails adicionais primeiro
  await db.delete(clientEmails).where(eq(clientEmails.clientId, id));
  
  // Eliminar cliente
  await db.delete(clients).where(eq(clients.id, id));
}

// Funções para emails adicionais
export async function addClientEmail(email: InsertClientEmail) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(clientEmails).values(email);
}

export async function getClientEmails(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(clientEmails)
    .where(eq(clientEmails.clientId, clientId))
    .orderBy(desc(clientEmails.createdAt));

  return result;
}

export async function deleteClientEmail(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(clientEmails).where(eq(clientEmails.id, id));
}
