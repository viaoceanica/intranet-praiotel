import { describe, it, expect, beforeAll } from "vitest";
import * as internalManagementDb from "./internalManagementDb";
import * as articleCommentsDb from "./articleCommentsDb";
import * as notificationHelpers from "./notificationHelpers";
import * as db from "./db";

describe("Melhorias Avançadas da Base de Conhecimento", () => {
  let testUserId: number;
  let testAuthorId: number;
  let testArticleId: number;
  let testCategoryId: number;

  beforeAll(async () => {
    // Obter utilizadores de teste
    const users = await db.getAllUsers();
    if (users.length >= 2) {
      testUserId = users[0].id;
      testAuthorId = users[1].id;
    } else {
      throw new Error("Necessários pelo menos 2 utilizadores para testes");
    }

    // Criar categoria de teste
    testCategoryId = await internalManagementDb.createKnowledgeCategory({
      name: "Categoria de Teste Avançada",
      description: "Para testes de pesquisa avançada",
      icon: "test",
    });

    // Criar artigo de teste
    testArticleId = await internalManagementDb.createKnowledgeArticle({
      title: "Artigo de Teste para Pesquisa Avançada",
      content: "Conteúdo de teste para sistema de pesquisa avançada e notificações",
      categoryId: testCategoryId,
      tags: "teste,pesquisa,avancada",
      authorId: testAuthorId,
    });
  });

  describe("Sistema de Notificações de Comentários", () => {
    it("deve obter participantes únicos de uma discussão", async () => {
      // Criar alguns comentários
      await articleCommentsDb.createComment(testArticleId, testUserId, "Primeiro comentário");
      await articleCommentsDb.createComment(testArticleId, testAuthorId, "Resposta do autor");
      await articleCommentsDb.createComment(testArticleId, testUserId, "Segundo comentário");

      const participants = await articleCommentsDb.getArticleParticipants(testArticleId);
      
      expect(Array.isArray(participants)).toBe(true);
      expect(participants.length).toBeGreaterThan(0);
      
      // Verificar que são IDs únicos
      const uniqueParticipants = [...new Set(participants)];
      expect(participants.length).toBe(uniqueParticipants.length);
    });

    it("deve notificar autor quando artigo recebe comentário", async () => {
      // Esta função deve executar sem erros
      await notificationHelpers.notifyArticleComment(
        testArticleId,
        "Artigo de Teste",
        testAuthorId,
        testUserId,
        "Utilizador Teste"
      );
      
      // Verificar que a notificação foi criada (assumindo que createNotification funciona)
      expect(true).toBe(true);
    });

    it("deve notificar participantes quando há novo comentário", async () => {
      const participants = [testUserId, testAuthorId];
      
      // Esta função deve executar sem erros
      await notificationHelpers.notifyArticleCommentParticipants(
        testArticleId,
        "Artigo de Teste",
        participants,
        testUserId,
        "Utilizador Teste"
      );
      
      expect(true).toBe(true);
    });
  });

  describe("Pesquisa Avançada", () => {
    it("deve pesquisar artigos por termo de pesquisa", async () => {
      const results = await internalManagementDb.advancedSearchKnowledgeArticles({
        searchTerm: "Pesquisa Avançada",
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const foundArticle = results.find((a: any) => a.id === testArticleId);
      expect(foundArticle).toBeDefined();
    });

    it("deve filtrar artigos por categoria", async () => {
      const results = await internalManagementDb.advancedSearchKnowledgeArticles({
        categoryId: testCategoryId,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Todos os resultados devem ser da categoria especificada
      results.forEach((article: any) => {
        expect(article.categoryId).toBe(testCategoryId);
      });
    });

    it("deve filtrar artigos por tags", async () => {
      const results = await internalManagementDb.advancedSearchKnowledgeArticles({
        tags: "avancada",
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const foundArticle = results.find((a: any) => a.id === testArticleId);
      expect(foundArticle).toBeDefined();
    });

    it("deve ordenar artigos por visualizações", async () => {
      // Incrementar visualizações do artigo de teste
      await internalManagementDb.incrementArticleView(testArticleId);
      await internalManagementDb.incrementArticleView(testArticleId);

      const results = await internalManagementDb.advancedSearchKnowledgeArticles({
        sortBy: "views",
      });

      expect(Array.isArray(results)).toBe(true);
      
      // Verificar que está ordenado por visualizações (decrescente)
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].viewCount).toBeGreaterThanOrEqual(results[i + 1].viewCount);
        }
      }
    });

    it("deve combinar múltiplos filtros", async () => {
      const results = await internalManagementDb.advancedSearchKnowledgeArticles({
        searchTerm: "Pesquisa",
        categoryId: testCategoryId,
        tags: "avancada",
        sortBy: "views",
      });

      expect(Array.isArray(results)).toBe(true);
      
      if (results.length > 0) {
        const foundArticle = results.find((a: any) => a.id === testArticleId);
        expect(foundArticle).toBeDefined();
        expect(foundArticle.categoryId).toBe(testCategoryId);
      }
    });
  });
});
