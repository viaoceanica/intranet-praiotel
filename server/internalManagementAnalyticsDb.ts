import { desc, sql, count } from "drizzle-orm";
import { getDb } from "./db";
import { knowledgeArticles, documents, announcements, users } from "../drizzle/schema";

/**
 * Obter artigos mais vistos
 */
export async function getTopViewedArticles(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const articles = await db
    .select({
      id: knowledgeArticles.id,
      title: knowledgeArticles.title,
      viewCount: knowledgeArticles.viewCount,
      categoryId: knowledgeArticles.categoryId,
      publishedAt: knowledgeArticles.publishedAt,
    })
    .from(knowledgeArticles)
    .orderBy(desc(knowledgeArticles.viewCount))
    .limit(limit);

  return articles;
}

/**
 * Obter documentos mais descarregados
 */
export async function getTopDownloadedDocuments(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const docs = await db
    .select({
      id: documents.id,
      name: documents.name,
      downloadCount: documents.downloadCount,
      categoryId: documents.categoryId,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .orderBy(desc(documents.downloadCount))
    .limit(limit);

  return docs;
}

/**
 * Obter estatísticas gerais de Gestão Interna
 */
export async function getInternalManagementStats() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Total de artigos
  const totalArticlesResult = await db
    .select({ count: count() })
    .from(knowledgeArticles);
  const totalArticles = totalArticlesResult[0]?.count || 0;

  // Total de visualizações de artigos
  const totalViewsResult = await db
    .select({ total: sql<number>`SUM(${knowledgeArticles.viewCount})` })
    .from(knowledgeArticles);
  const totalViews = totalViewsResult[0]?.total || 0;

  // Total de documentos
  const totalDocumentsResult = await db
    .select({ count: count() })
    .from(documents);
  const totalDocuments = totalDocumentsResult[0]?.count || 0;

  // Total de downloads
  const totalDownloadsResult = await db
    .select({ total: sql<number>`SUM(${documents.downloadCount})` })
    .from(documents);
  const totalDownloads = totalDownloadsResult[0]?.total || 0;

  // Total de anúncios
  const totalAnnouncementsResult = await db
    .select({ count: count() })
    .from(announcements);
  const totalAnnouncements = totalAnnouncementsResult[0]?.count || 0;

  // Total de utilizadores
  const totalUsersResult = await db
    .select({ count: count() })
    .from(users);
  const totalUsers = totalUsersResult[0]?.count || 0;

  return {
    totalArticles,
    totalViews,
    avgViewsPerArticle: totalArticles > 0 ? Math.round(totalViews / totalArticles) : 0,
    totalDocuments,
    totalDownloads,
    avgDownloadsPerDocument: totalDocuments > 0 ? Math.round(totalDownloads / totalDocuments) : 0,
    totalAnnouncements,
    totalUsers,
  };
}

/**
 * Obter artigos recentes (últimos 30 dias)
 */
export async function getRecentArticles(days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  const articles = await db
    .select({
      id: knowledgeArticles.id,
      title: knowledgeArticles.title,
      viewCount: knowledgeArticles.viewCount,
      publishedAt: knowledgeArticles.publishedAt,
    })
    .from(knowledgeArticles)
    .where(sql`${knowledgeArticles.publishedAt} >= ${dateThreshold}`)
    .orderBy(desc(knowledgeArticles.publishedAt));

  return articles;
}

/**
 * Obter documentos recentes (últimos 30 dias)
 */
export async function getRecentDocuments(days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  const docs = await db
    .select({
      id: documents.id,
      name: documents.name,
      downloadCount: documents.downloadCount,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(sql`${documents.createdAt} >= ${dateThreshold}`)
    .orderBy(desc(documents.createdAt));

  return docs;
}
