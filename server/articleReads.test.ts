import { describe, it, expect, beforeAll } from "vitest";
import * as articleReadsDb from "./articleReadsDb";
import * as internalManagementDb from "./internalManagementDb";
import * as db from "./db";

describe("Sistema de Indicadores de Artigos Não Lidos", () => {
  let testUserId: number;
  let testArticleId: number;
  let testCategoryId: number;

  beforeAll(async () => {
    // Obter utilizador de teste
    const users = await db.getAllUsers();
    if (users.length > 0) {
      testUserId = users[0].id;
    } else {
      throw new Error("Necessário pelo menos 1 utilizador para testes");
    }

    // Criar categoria de teste
    testCategoryId = await internalManagementDb.createKnowledgeCategory({
      name: "Categoria de Teste Leituras",
      description: "Para testes de leituras de artigos",
      icon: "test",
    });

    // Criar artigo de teste
    testArticleId = await internalManagementDb.createKnowledgeArticle({
      title: "Artigo de Teste para Leituras",
      content: "Conteúdo de teste para sistema de indicadores de leitura",
      categoryId: testCategoryId,
      tags: "teste,leitura",
      authorId: testUserId,
    });
  });

  describe("Marcação de Leitura", () => {
    it("deve marcar artigo como lido", async () => {
      const id = await articleReadsDb.markArticleAsRead(testArticleId, testUserId);
      
      expect(id).toBeGreaterThan(0);
    });

    it("deve verificar se artigo foi lido", async () => {
      // Marcar como lido
      await articleReadsDb.markArticleAsRead(testArticleId, testUserId);
      
      // Verificar
      const hasRead = await articleReadsDb.hasUserReadArticle(testArticleId, testUserId);
      
      expect(hasRead).toBe(true);
    });

    it("não deve criar duplicados ao marcar como lido múltiplas vezes", async () => {
      // Marcar como lido várias vezes
      await articleReadsDb.markArticleAsRead(testArticleId, testUserId);
      await articleReadsDb.markArticleAsRead(testArticleId, testUserId);
      await articleReadsDb.markArticleAsRead(testArticleId, testUserId);
      
      // Obter artigos lidos
      const readArticles = await articleReadsDb.getUserReadArticles(testUserId);
      
      // Contar quantas vezes o artigo aparece
      const count = readArticles.filter(id => id === testArticleId).length;
      
      // Deve aparecer apenas uma vez
      expect(count).toBe(1);
    });

    it("deve obter lista de artigos lidos por utilizador", async () => {
      // Criar mais artigos de teste
      const articleId2 = await internalManagementDb.createKnowledgeArticle({
        title: "Artigo de Teste 2",
        content: "Conteúdo de teste 2",
        categoryId: testCategoryId,
        tags: "teste",
        authorId: testUserId,
      });

      const articleId3 = await internalManagementDb.createKnowledgeArticle({
        title: "Artigo de Teste 3",
        content: "Conteúdo de teste 3",
        categoryId: testCategoryId,
        tags: "teste",
        authorId: testUserId,
      });

      // Marcar como lidos
      await articleReadsDb.markArticleAsRead(testArticleId, testUserId);
      await articleReadsDb.markArticleAsRead(articleId2, testUserId);
      await articleReadsDb.markArticleAsRead(articleId3, testUserId);

      // Obter lista
      const readArticles = await articleReadsDb.getUserReadArticles(testUserId);

      expect(Array.isArray(readArticles)).toBe(true);
      expect(readArticles.length).toBeGreaterThanOrEqual(3);
      expect(readArticles).toContain(testArticleId);
      expect(readArticles).toContain(articleId2);
      expect(readArticles).toContain(articleId3);
    });

    it("deve retornar false para artigo não lido", async () => {
      // Criar novo artigo que não será lido
      const unreadArticleId = await internalManagementDb.createKnowledgeArticle({
        title: "Artigo Não Lido",
        content: "Este artigo não foi lido",
        categoryId: testCategoryId,
        tags: "teste",
        authorId: testUserId,
      });

      // Verificar se foi lido (deve retornar false)
      const hasRead = await articleReadsDb.hasUserReadArticle(unreadArticleId, testUserId);

      expect(hasRead).toBe(false);
    });
  });
});
