import { eq, and, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, passwordResetTokens, serviceTypes, InsertServiceType } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(users).values(user);
  return result;
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set(data).where(eq(users.id, id));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  const result = await db.select().from(users);
  return result;
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(users).where(eq(users.id, id));
}

// --- Password Reset ---

export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
}

export async function getValidPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, 0),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markPasswordResetTokenUsed(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(passwordResetTokens).set({ used: 1 }).where(eq(passwordResetTokens.token, token));
}

// --- Service Types ---

export async function getAllServiceTypes() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get service types: database not available");
    return [];
  }
  const result = await db.select().from(serviceTypes);
  return result;
}

export async function getActiveServiceTypes() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get service types: database not available");
    return [];
  }
  const result = await db.select().from(serviceTypes).where(eq(serviceTypes.active, 1));
  return result;
}

export async function getServiceTypeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(serviceTypes).where(eq(serviceTypes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createServiceType(data: InsertServiceType) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(serviceTypes).values(data);
  return result;
}

export async function updateServiceType(id: number, data: Partial<InsertServiceType>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(serviceTypes).set(data).where(eq(serviceTypes.id, id));
}

export async function deleteServiceType(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(serviceTypes).where(eq(serviceTypes.id, id));
}
