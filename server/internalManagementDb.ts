import { getDb } from "./db";
import {
  internalNews,
  quickAccess,
  announcements,
  bulletinMessages,
  bulletinLikes,
  documentCategories,
  documents,
  knowledgeCategories,
  knowledgeArticles,
  users,
} from "../drizzle/schema";
import { eq, desc, sql, and, like, or } from "drizzle-orm";

// ===== PAINEL INICIAL =====

/**
 * Obter todas as notícias internas (ordenadas por data de publicação)
 */
export async function getAllNews(limit = 10, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: internalNews.id,
      title: internalNews.title,
      content: internalNews.content,
      authorId: internalNews.authorId,
      authorName: users.name,
      publishedAt: internalNews.publishedAt,
      createdAt: internalNews.createdAt,
    })
    .from(internalNews)
    .leftJoin(users, eq(internalNews.authorId, users.id))
    .orderBy(desc(internalNews.publishedAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Obter uma notícia específica por ID
 */
export async function getNewsById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: internalNews.id,
      title: internalNews.title,
      content: internalNews.content,
      authorId: internalNews.authorId,
      authorName: users.name,
      publishedAt: internalNews.publishedAt,
      createdAt: internalNews.createdAt,
      updatedAt: internalNews.updatedAt,
    })
    .from(internalNews)
    .leftJoin(users, eq(internalNews.authorId, users.id))
    .where(eq(internalNews.id, id));

  return result[0];
}

/**
 * Criar nova notícia interna
 */
export async function createNews(data: {
  title: string;
  content: string;
  authorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(internalNews).values(data);
  return result[0].insertId;
}

/**
 * Atualizar notícia existente
 */
export async function updateNews(
  id: number,
  data: { title?: string; content?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(internalNews).set(data).where(eq(internalNews.id, id));
}

/**
 * Eliminar notícia
 */
export async function deleteNews(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(internalNews).where(eq(internalNews.id, id));
}

/**
 * Obter todos os acessos rápidos (ordenados por displayOrder)
 */
export async function getAllQuickAccess() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(quickAccess)
    .orderBy(quickAccess.displayOrder);
}

/**
 * Criar novo acesso rápido
 */
export async function createQuickAccess(data: {
  name: string;
  url: string;
  icon: string;
  displayOrder?: number;
  createdById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(quickAccess).values(data);
  return result[0].insertId;
}

/**
 * Atualizar acesso rápido
 */
export async function updateQuickAccess(
  id: number,
  data: { name?: string; url?: string; icon?: string; displayOrder?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(quickAccess).set(data).where(eq(quickAccess.id, id));
}

/**
 * Eliminar acesso rápido
 */
export async function deleteQuickAccess(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(quickAccess).where(eq(quickAccess.id, id));
}

// ===== ÁREA DE COMUNICAÇÃO =====

/**
 * Obter todos os anúncios (ordenados por data de publicação)
 */
export async function getAllAnnouncements(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      priority: announcements.priority,
      authorId: announcements.authorId,
      authorName: users.name,
      publishedAt: announcements.publishedAt,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .leftJoin(users, eq(announcements.authorId, users.id))
    .orderBy(desc(announcements.publishedAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Criar novo anúncio
 */
export async function createAnnouncement(data: {
  title: string;
  content: string;
  priority?: "baixa" | "normal" | "alta" | "urgente";
  authorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(announcements).values(data);
  return result[0].insertId;
}

/**
 * Atualizar anúncio
 */
export async function updateAnnouncement(
  id: number,
  data: {
    title?: string;
    content?: string;
    priority?: "baixa" | "normal" | "alta" | "urgente";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(announcements).set(data).where(eq(announcements.id, id));
}

/**
 * Eliminar anúncio
 */
export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(announcements).where(eq(announcements.id, id));
}

/**
 * Obter todas as mensagens do mural (ordenadas por data)
 */
export async function getAllBulletinMessages(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: bulletinMessages.id,
      message: bulletinMessages.message,
      authorId: bulletinMessages.authorId,
      authorName: users.name,
      likesCount: bulletinMessages.likesCount,
      createdAt: bulletinMessages.createdAt,
    })
    .from(bulletinMessages)
    .leftJoin(users, eq(bulletinMessages.authorId, users.id))
    .orderBy(desc(bulletinMessages.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Criar nova mensagem no mural
 */
export async function createBulletinMessage(data: {
  message: string;
  authorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bulletinMessages).values(data);
  return result[0].insertId;
}

/**
 * Eliminar mensagem do mural
 */
export async function deleteBulletinMessage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Eliminar likes associados primeiro
  await db.delete(bulletinLikes).where(eq(bulletinLikes.messageId, id));
  // Eliminar mensagem
  await db.delete(bulletinMessages).where(eq(bulletinMessages.id, id));
}

/**
 * Dar like numa mensagem
 */
export async function likeBulletinMessage(messageId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já deu like
  const existing = await db
    .select()
    .from(bulletinLikes)
    .where(
      and(
        eq(bulletinLikes.messageId, messageId),
        eq(bulletinLikes.userId, userId)
      )
    );

  if (existing.length > 0) {
    // Remover like (unlike)
    await db
      .delete(bulletinLikes)
      .where(
        and(
          eq(bulletinLikes.messageId, messageId),
          eq(bulletinLikes.userId, userId)
        )
      );
    // Decrementar contador
    await db
      .update(bulletinMessages)
      .set({ likesCount: sql`${bulletinMessages.likesCount} - 1` })
      .where(eq(bulletinMessages.id, messageId));
    return { action: "unliked" };
  } else {
    // Adicionar like
    await db.insert(bulletinLikes).values({ messageId, userId });
    // Incrementar contador
    await db
      .update(bulletinMessages)
      .set({ likesCount: sql`${bulletinMessages.likesCount} + 1` })
      .where(eq(bulletinMessages.id, messageId));
    return { action: "liked" };
  }
}

/**
 * Verificar se utilizador deu like numa mensagem
 */
export async function hasUserLikedMessage(messageId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(bulletinLikes)
    .where(
      and(
        eq(bulletinLikes.messageId, messageId),
        eq(bulletinLikes.userId, userId)
      )
    );
  return result.length > 0;
}

// ===== GESTÃO DE DOCUMENTOS =====

/**
 * Obter todas as categorias de documentos
 */
export async function getAllDocumentCategories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(documentCategories);
}

/**
 * Criar categoria de documentos
 */
export async function createDocumentCategory(data: {
  name: string;
  description?: string;
  icon: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documentCategories).values(data);
  return result[0].insertId;
}

/**
 * Obter todos os documentos (com filtro opcional por categoria)
 */
export async function getAllDocuments(categoryId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const query = db
    .select({
      id: documents.id,
      name: documents.name,
      categoryId: documents.categoryId,
      categoryName: documentCategories.name,
      fileKey: documents.fileKey,
      fileUrl: documents.fileUrl,
      fileSize: documents.fileSize,
      mimeType: documents.mimeType,
      uploadedById: documents.uploadedById,
      uploaderName: users.name,
      downloadCount: documents.downloadCount,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .leftJoin(documentCategories, eq(documents.categoryId, documentCategories.id))
    .leftJoin(users, eq(documents.uploadedById, users.id))
    .orderBy(desc(documents.createdAt));

  if (categoryId) {
    return await query.where(eq(documents.categoryId, categoryId));
  }

  return await query;
}

/**
 * Pesquisar documentos por nome
 */
export async function searchDocuments(searchTerm: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: documents.id,
      name: documents.name,
      categoryId: documents.categoryId,
      categoryName: documentCategories.name,
      fileKey: documents.fileKey,
      fileUrl: documents.fileUrl,
      fileSize: documents.fileSize,
      mimeType: documents.mimeType,
      uploadedById: documents.uploadedById,
      uploaderName: users.name,
      downloadCount: documents.downloadCount,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .leftJoin(documentCategories, eq(documents.categoryId, documentCategories.id))
    .leftJoin(users, eq(documents.uploadedById, users.id))
    .where(like(documents.name, `%${searchTerm}%`))
    .orderBy(desc(documents.createdAt));
}

/**
 * Criar novo documento
 */
export async function createDocument(data: {
  name: string;
  categoryId: number;
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documents).values(data);
  return result[0].insertId;
}

/**
 * Incrementar contador de downloads
 */
export async function incrementDocumentDownload(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(documents)
    .set({ downloadCount: sql`${documents.downloadCount} + 1` })
    .where(eq(documents.id, id));
}

/**
 * Eliminar documento
 */
export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(documents).where(eq(documents.id, id));
}

// ===== BASE DE CONHECIMENTO =====

/**
 * Obter todas as categorias de conhecimento
 */
export async function getAllKnowledgeCategories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(knowledgeCategories)
    .orderBy(knowledgeCategories.displayOrder);
}

/**
 * Criar categoria de conhecimento
 */
export async function createKnowledgeCategory(data: {
  name: string;
  description?: string;
  icon: string;
  displayOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(knowledgeCategories).values(data);
  return result[0].insertId;
}

/**
 * Obter todos os artigos (com filtro opcional por categoria)
 */
export async function getAllKnowledgeArticles(categoryId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const query = db
    .select({
      id: knowledgeArticles.id,
      title: knowledgeArticles.title,
      content: knowledgeArticles.content,
      categoryId: knowledgeArticles.categoryId,
      categoryName: knowledgeCategories.name,
      tags: knowledgeArticles.tags,
      authorId: knowledgeArticles.authorId,
      authorName: users.name,
      viewCount: knowledgeArticles.viewCount,
      publishedAt: knowledgeArticles.publishedAt,
      createdAt: knowledgeArticles.createdAt,
    })
    .from(knowledgeArticles)
    .leftJoin(
      knowledgeCategories,
      eq(knowledgeArticles.categoryId, knowledgeCategories.id)
    )
    .leftJoin(users, eq(knowledgeArticles.authorId, users.id))
    .orderBy(desc(knowledgeArticles.publishedAt));

  if (categoryId) {
    return await query.where(eq(knowledgeArticles.categoryId, categoryId));
  }

  return await query;
}

/**
 * Pesquisar artigos por título ou conteúdo
 */
export async function searchKnowledgeArticles(searchTerm: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: knowledgeArticles.id,
      title: knowledgeArticles.title,
      content: knowledgeArticles.content,
      categoryId: knowledgeArticles.categoryId,
      categoryName: knowledgeCategories.name,
      tags: knowledgeArticles.tags,
      authorId: knowledgeArticles.authorId,
      authorName: users.name,
      viewCount: knowledgeArticles.viewCount,
      publishedAt: knowledgeArticles.publishedAt,
      createdAt: knowledgeArticles.createdAt,
    })
    .from(knowledgeArticles)
    .leftJoin(
      knowledgeCategories,
      eq(knowledgeArticles.categoryId, knowledgeCategories.id)
    )
    .leftJoin(users, eq(knowledgeArticles.authorId, users.id))
    .where(
      or(
        like(knowledgeArticles.title, `%${searchTerm}%`),
        like(knowledgeArticles.content, `%${searchTerm}%`)
      )
    )
    .orderBy(desc(knowledgeArticles.publishedAt));
}

/**
 * Obter artigo específico por ID
 */
export async function getKnowledgeArticleById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: knowledgeArticles.id,
      title: knowledgeArticles.title,
      content: knowledgeArticles.content,
      categoryId: knowledgeArticles.categoryId,
      categoryName: knowledgeCategories.name,
      tags: knowledgeArticles.tags,
      authorId: knowledgeArticles.authorId,
      authorName: users.name,
      viewCount: knowledgeArticles.viewCount,
      publishedAt: knowledgeArticles.publishedAt,
      createdAt: knowledgeArticles.createdAt,
      updatedAt: knowledgeArticles.updatedAt,
    })
    .from(knowledgeArticles)
    .leftJoin(
      knowledgeCategories,
      eq(knowledgeArticles.categoryId, knowledgeCategories.id)
    )
    .leftJoin(users, eq(knowledgeArticles.authorId, users.id))
    .where(eq(knowledgeArticles.id, id));

  return result[0];
}

/**
 * Criar novo artigo
 */
export async function createKnowledgeArticle(data: {
  title: string;
  content: string;
  categoryId: number;
  tags?: string;
  authorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(knowledgeArticles).values(data);
  return result[0].insertId;
}

/**
 * Atualizar artigo
 */
export async function updateKnowledgeArticle(
  id: number,
  data: {
    title?: string;
    content?: string;
    categoryId?: number;
    tags?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(knowledgeArticles)
    .set(data)
    .where(eq(knowledgeArticles.id, id));
}

/**
 * Incrementar contador de visualizações
 */
export async function incrementArticleView(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(knowledgeArticles)
    .set({ viewCount: sql`${knowledgeArticles.viewCount} + 1` })
    .where(eq(knowledgeArticles.id, id));
}

/**
 * Eliminar artigo
 */
export async function deleteKnowledgeArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(knowledgeArticles).where(eq(knowledgeArticles.id, id));
}
