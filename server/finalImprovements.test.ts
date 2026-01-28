import { describe, it, expect, beforeAll } from "vitest";
import * as articleCommentsDb from "./articleCommentsDb";
import * as internalManagementDb from "./internalManagementDb";
import * as db from "./db";

describe("Melhorias Finais de Gestão Interna", () => {
  let testUserId: number;
  let testArticleId: number;
  let testCommentId: number;

  beforeAll(async () => {
    // Obter utilizador de teste
    const users = await db.getAllUsers();
    if (users.length > 0) {
      testUserId = users[0].id;
    } else {
      throw new Error("Nenhum utilizador encontrado para testes");
    }

    // Criar artigo de teste
    testArticleId = await internalManagementDb.createKnowledgeArticle({
      title: "Artigo de Teste para Comentários",
      content: "Conteúdo de teste para sistema de comentários",
      categoryId: 1,
      tags: "teste,comentarios",
      authorId: testUserId,
    });
  });

  describe("Sistema de Comentários", () => {
    it("deve criar comentário em artigo", async () => {
      testCommentId = await articleCommentsDb.createComment(
        testArticleId,
        testUserId,
        "Este é um comentário de teste"
      );
      expect(testCommentId).toBeGreaterThan(0);
    });

    it("deve listar comentários de um artigo", async () => {
      const comments = await articleCommentsDb.getArticleComments(testArticleId);
      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBeGreaterThan(0);
      
      const comment = comments.find((c: any) => c.id === testCommentId);
      expect(comment).toBeDefined();
      expect(comment?.comment).toBe("Este é um comentário de teste");
      expect(comment?.userName).toBeDefined();
    });

    it("deve obter comentário por ID", async () => {
      const comment = await articleCommentsDb.getCommentById(testCommentId);
      expect(comment).toBeDefined();
      expect(comment.id).toBe(testCommentId);
      expect(comment.articleId).toBe(testArticleId);
      expect(comment.userId).toBe(testUserId);
    });

    it("deve eliminar comentário", async () => {
      await articleCommentsDb.deleteComment(testCommentId);
      
      const comments = await articleCommentsDb.getArticleComments(testArticleId);
      const deletedComment = comments.find((c: any) => c.id === testCommentId);
      expect(deletedComment).toBeUndefined();
    });
  });

  describe("Visualização de Artigos", () => {
    it("deve obter artigo por ID", async () => {
      const article = await internalManagementDb.getKnowledgeArticleById(testArticleId);
      expect(article).toBeDefined();
      expect(article.id).toBe(testArticleId);
      expect(article.title).toBe("Artigo de Teste para Comentários");
    });

    it("deve incrementar visualizações de artigo", async () => {
      const articleBefore = await internalManagementDb.getKnowledgeArticleById(testArticleId);
      const viewsBefore = articleBefore.viewCount;

      await internalManagementDb.incrementArticleView(testArticleId);

      const articleAfter = await internalManagementDb.getKnowledgeArticleById(testArticleId);
      expect(articleAfter.viewCount).toBe(viewsBefore + 1);
    });
  });
});
