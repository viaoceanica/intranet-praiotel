import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { tags, articleTags, type InsertTag, type InsertArticleTag } from "../drizzle/schema";

/**
 * Tags - CRUD operations
 */

export async function createTag(data: InsertTag) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.insert(tags).values(data);
}

export async function getAllTags() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db.select().from(tags).orderBy(tags.name);
}

export async function getTagById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const result = await db.select().from(tags).where(eq(tags.id, id));
  return result[0] || null;
}

export async function updateTag(id: number, data: Partial<InsertTag>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.update(tags).set(data).where(eq(tags.id, id));
}

export async function deleteTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  // Primeiro remove todas as associações com artigos
  await db.delete(articleTags).where(eq(articleTags.tagId, id));
  // Depois remove a tag
  await db.delete(tags).where(eq(tags.id, id));
}

/**
 * Article Tags - Relacionamento entre artigos e tags
 */

export async function addTagToArticle(articleId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.insert(articleTags).values({ articleId, tagId });
}

export async function removeTagFromArticle(articleId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.delete(articleTags).where(
    and(
      eq(articleTags.articleId, articleId),
      eq(articleTags.tagId, tagId)
    )
  );
}

export async function getArticleTags(articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const result = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(articleTags)
    .innerJoin(tags, eq(articleTags.tagId, tags.id))
    .where(eq(articleTags.articleId, articleId));
  return result;
}

export async function setArticleTags(articleId: number, tagIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  // Remove todas as tags existentes do artigo
  await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
  
  // Adiciona as novas tags
  if (tagIds.length > 0) {
    const values = tagIds.map(tagId => ({ articleId, tagId }));
    await db.insert(articleTags).values(values);
  }
}

export async function getArticlesByTag(tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const result = await db
    .select({
      articleId: articleTags.articleId,
    })
    .from(articleTags)
    .where(eq(articleTags.tagId, tagId));
  return result.map(r => r.articleId);
}

export async function getArticlesByTags(tagIds: number[]) {
  if (tagIds.length === 0) return [];
  
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const result = await db
    .select({
      articleId: articleTags.articleId,
    })
    .from(articleTags)
    .where(inArray(articleTags.tagId, tagIds))
    .groupBy(articleTags.articleId);
  
  return result.map(r => r.articleId);
}
