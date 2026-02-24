import { eq, like, or, sql, desc, asc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { commercialClients, type InsertCommercialClient } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  if (!_db) throw new Error("Database not available");
  return _db;
}

export async function getAllCommercialClients(opts?: {
  search?: string;
  zone?: string;
  salesperson?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}) {
  const db = getDb();
  const page = opts?.page || 1;
  const limit = opts?.limit || 50;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];

  if (opts?.search) {
    const searchTerm = `%${opts.search}%`;
    conditions.push(
      or(
        like(commercialClients.company, searchTerm),
        like(commercialClients.nif, searchTerm),
        like(commercialClients.email, searchTerm),
        like(commercialClients.phone1, searchTerm),
        like(commercialClients.locality, searchTerm)
      )
    );
  }

  if (opts?.zone) {
    conditions.push(eq(commercialClients.zone, opts.zone));
  }

  if (opts?.salesperson) {
    conditions.push(eq(commercialClients.salesperson, opts.salesperson));
  }

  if (opts?.active !== undefined) {
    conditions.push(eq(commercialClients.active, opts.active ? 1 : 0));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(commercialClients)
      .where(whereClause)
      .orderBy(asc(commercialClients.company))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(commercialClients)
      .where(whereClause),
  ]);

  return {
    items,
    total: Number(countResult[0]?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
  };
}

export async function getCommercialClientById(id: number) {
  const db = getDb();
  const result = await db
    .select()
    .from(commercialClients)
    .where(eq(commercialClients.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createCommercialClient(data: InsertCommercialClient) {
  const db = getDb();
  const result = await db.insert(commercialClients).values(data);
  return Number(result[0].insertId);
}

export async function updateCommercialClient(
  id: number,
  data: Partial<InsertCommercialClient>
) {
  const db = getDb();
  await db
    .update(commercialClients)
    .set(data)
    .where(eq(commercialClients.id, id));
}

export async function deleteCommercialClient(id: number) {
  const db = getDb();
  await db.delete(commercialClients).where(eq(commercialClients.id, id));
}

export async function getZones() {
  const db = getDb();
  const result = await db
    .selectDistinct({ zone: commercialClients.zone })
    .from(commercialClients)
    .where(sql`${commercialClients.zone} IS NOT NULL AND ${commercialClients.zone} != ''`)
    .orderBy(asc(commercialClients.zone));
  return result.map((r: any) => r.zone).filter(Boolean);
}

export async function getSalespersons() {
  const db = getDb();
  const result = await db
    .selectDistinct({ salesperson: commercialClients.salesperson })
    .from(commercialClients)
    .where(sql`${commercialClients.salesperson} IS NOT NULL AND ${commercialClients.salesperson} != ''`)
    .orderBy(asc(commercialClients.salesperson));
  return result.map((r: any) => r.salesperson).filter(Boolean);
}

export async function getCommercialClientStats() {
  const db = getDb();
  const [totalResult, activeResult, blockedResult, zonesResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(commercialClients),
    db.select({ count: sql<number>`count(*)` }).from(commercialClients).where(eq(commercialClients.active, 1)),
    db.select({ count: sql<number>`count(*)` }).from(commercialClients).where(eq(commercialClients.blocked, 1)),
    db.selectDistinct({ zone: commercialClients.zone }).from(commercialClients).where(sql`${commercialClients.zone} IS NOT NULL AND ${commercialClients.zone} != ''`),
  ]);

  return {
    total: Number(totalResult[0]?.count || 0),
    active: Number(activeResult[0]?.count || 0),
    blocked: Number(blockedResult[0]?.count || 0),
    zones: zonesResult.length,
  };
}

/**
 * Importar clientes comerciais a partir de dados parseados do Excel
 * Usa upsert baseado no externalId (N_ do ERP)
 * Suporta callback de progresso para atualização em tempo real
 */
export async function importCommercialClients(
  clients: InsertCommercialClient[],
  onProgress?: (progress: {
    processed: number;
    total: number;
    imported: number;
    updated: number;
    errors: number;
    currentCompany: string;
  }) => void
): Promise<{ imported: number; updated: number; errors: string[] }> {
  const db = getDb();
  let imported = 0;
  let updated = 0;
  const errors: string[] = [];
  const total = clients.length;

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    try {
      // Filtrar emails @viaoceanica.com conforme regra
      if (client.email && client.email.toLowerCase().includes("@viaoceanica.com")) {
        client.email = null as any;
      }

      if (client.externalId) {
        // Verificar se já existe pelo externalId
        const existing = await db
          .select()
          .from(commercialClients)
          .where(eq(commercialClients.externalId, client.externalId))
          .limit(1);

        if (existing.length > 0) {
          // Atualizar
          await db
            .update(commercialClients)
            .set({ ...client, updatedAt: new Date() })
            .where(eq(commercialClients.externalId, client.externalId));
          updated++;
        } else {
          // Inserir
          await db.insert(commercialClients).values(client);
          imported++;
        }
      } else {
        // Sem externalId, inserir diretamente
        await db.insert(commercialClients).values(client);
        imported++;
      }
    } catch (err: any) {
      errors.push(`Erro ao importar "${client.company}": ${err.message}`);
    }

    // Enviar progresso a cada registo
    if (onProgress) {
      onProgress({
        processed: i + 1,
        total,
        imported,
        updated,
        errors: errors.length,
        currentCompany: client.company || "Sem Nome",
      });
    }
  }

  return { imported, updated, errors };
}
