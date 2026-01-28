import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { favorites, knowledgeArticles, documents, users } from "../drizzle/schema";

/**
 * Adicionar item aos favoritos
 */
export async function addFavorite(userId: number, itemType: "article" | "document", itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  // Verificar se já existe
  const existing = await db
    .select()
    .from(favorites)
    .where(and(
      eq(favorites.userId, userId),
      eq(favorites.itemType, itemType),
      eq(favorites.itemId, itemId)
    ))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const result = await db.insert(favorites).values({
    userId,
    itemType,
    itemId,
  });

  return result[0].insertId;
}

/**
 * Remover item dos favoritos
 */
export async function removeFavorite(userId: number, itemType: "article" | "document", itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db
    .delete(favorites)
    .where(and(
      eq(favorites.userId, userId),
      eq(favorites.itemType, itemType),
      eq(favorites.itemId, itemId)
    ));
}

/**
 * Verificar se item está nos favoritos
 */
export async function isFavorite(userId: number, itemType: "article" | "document", itemId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db
    .select()
    .from(favorites)
    .where(and(
      eq(favorites.userId, userId),
      eq(favorites.itemType, itemType),
      eq(favorites.itemId, itemId)
    ))
    .limit(1);

  return result.length > 0;
}

/**
 * Listar todos os favoritos do utilizador
 */
export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  // Buscar artigos favoritos
  const favoriteArticles = await db
    .select({
      id: knowledgeArticles.id,
      title: knowledgeArticles.title,
      content: knowledgeArticles.content,
      categoryId: knowledgeArticles.categoryId,
      authorId: knowledgeArticles.authorId,
      publishedAt: knowledgeArticles.publishedAt,
      viewCount: knowledgeArticles.viewCount,
      type: favorites.itemType,
      favoritedAt: favorites.createdAt,
    })
    .from(favorites)
    .innerJoin(knowledgeArticles, eq(favorites.itemId, knowledgeArticles.id))
    .where(and(
      eq(favorites.userId, userId),
      eq(favorites.itemType, "article")
    ));

  // Buscar documentos favoritos
  const favoriteDocuments = await db
    .select({
      id: documents.id,
      name: documents.name,
      categoryId: documents.categoryId,
      fileUrl: documents.fileUrl,
      fileSize: documents.fileSize,
      mimeType: documents.mimeType,
      uploadedById: documents.uploadedById,
      createdAt: documents.createdAt,
      downloadCount: documents.downloadCount,
      type: favorites.itemType,
      favoritedAt: favorites.createdAt,
    })
    .from(favorites)
    .innerJoin(documents, eq(favorites.itemId, documents.id))
    .where(and(
      eq(favorites.userId, userId),
      eq(favorites.itemType, "document")
    ));

  return {
    articles: favoriteArticles,
    documents: favoriteDocuments,
  };
}
