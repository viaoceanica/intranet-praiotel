import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { articleComments, users } from "../drizzle/schema";

/**
 * Criar comentário em artigo
 */
export async function createComment(articleId: number, userId: number, comment: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db.insert(articleComments).values({
    articleId,
    userId,
    comment,
  });

  return result[0].insertId;
}

/**
 * Listar comentários de um artigo
 */
export async function getArticleComments(articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const comments = await db
    .select({
      id: articleComments.id,
      articleId: articleComments.articleId,
      userId: articleComments.userId,
      comment: articleComments.comment,
      createdAt: articleComments.createdAt,
      updatedAt: articleComments.updatedAt,
      userName: users.name,
    })
    .from(articleComments)
    .leftJoin(users, eq(articleComments.userId, users.id))
    .where(eq(articleComments.articleId, articleId))
    .orderBy(desc(articleComments.createdAt));

  return comments;
}

/**
 * Eliminar comentário (apenas o autor ou admin)
 */
export async function deleteComment(commentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db.delete(articleComments).where(eq(articleComments.id, commentId));
}

/**
 * Obter comentário por ID
 */
export async function getCommentById(commentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select()
    .from(articleComments)
    .where(eq(articleComments.id, commentId))
    .limit(1);

  return result[0];
}
