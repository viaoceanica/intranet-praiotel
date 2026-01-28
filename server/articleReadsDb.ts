import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { articleReads } from "../drizzle/schema";

/**
 * Marcar artigo como lido por um utilizador
 */
export async function markArticleAsRead(articleId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Verificar se já existe registo de leitura
  const existing = await db
    .select()
    .from(articleReads)
    .where(and(eq(articleReads.articleId, articleId), eq(articleReads.userId, userId)))
    .limit(1);

  // Se já foi lido, não criar duplicado
  if (existing.length > 0) {
    return existing[0].id;
  }

  // Criar novo registo de leitura
  const result = await db.insert(articleReads).values({
    articleId,
    userId,
  });

  return result[0].insertId;
}

/**
 * Verificar se um artigo foi lido por um utilizador
 */
export async function hasUserReadArticle(articleId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select()
    .from(articleReads)
    .where(and(eq(articleReads.articleId, articleId), eq(articleReads.userId, userId)))
    .limit(1);

  return result.length > 0;
}

/**
 * Obter todos os artigos lidos por um utilizador
 */
export async function getUserReadArticles(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select({ articleId: articleReads.articleId })
    .from(articleReads)
    .where(eq(articleReads.userId, userId));

  return result.map((r) => r.articleId);
}
