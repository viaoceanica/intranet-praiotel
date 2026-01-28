import { describe, it, expect, beforeAll } from "vitest";
import * as favoritesDb from "./favoritesDb";
import * as internalManagementAnalyticsDb from "./internalManagementAnalyticsDb";
import * as internalManagementDb from "./internalManagementDb";
import * as db from "./db";

describe("Melhorias Avançadas de Gestão Interna", () => {
  let testUserId: number;
  let testArticleId: number;
  let testDocumentId: number;

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
      title: "Artigo de Teste para Favoritos",
      content: "Conteúdo de teste",
      categoryId: 1,
      tags: "teste",
      authorId: testUserId,
    });

    // Criar categoria e documento de teste (usar timestamp para nome único)
    const categoryId = await internalManagementDb.createDocumentCategory({
      name: `Categoria Teste ${Date.now()}`,
      description: "Teste",
      icon: "FileText",
    });

    testDocumentId = await internalManagementDb.createDocument({
      name: "documento-teste.pdf",
      categoryId,
      fileUrl: "https://example.com/test.pdf",
      fileKey: "test/test.pdf",
      fileSize: 1024,
      mimeType: "application/pdf",
      uploadedById: testUserId,
    });
  });

  describe("Sistema de Favoritos", () => {
    it("deve adicionar artigo aos favoritos", async () => {
      const id = await favoritesDb.addFavorite(testUserId, "article", testArticleId);
      expect(id).toBeGreaterThan(0);

      const isFav = await favoritesDb.isFavorite(testUserId, "article", testArticleId);
      expect(isFav).toBe(true);
    });

    it("deve adicionar documento aos favoritos", async () => {
      const id = await favoritesDb.addFavorite(testUserId, "document", testDocumentId);
      expect(id).toBeGreaterThan(0);

      const isFav = await favoritesDb.isFavorite(testUserId, "document", testDocumentId);
      expect(isFav).toBe(true);
    });

    it("deve listar favoritos do utilizador", async () => {
      const favorites = await favoritesDb.getUserFavorites(testUserId);
      expect(favorites.articles.length).toBeGreaterThan(0);
      expect(favorites.documents.length).toBeGreaterThan(0);
    });

    it("deve remover item dos favoritos", async () => {
      await favoritesDb.removeFavorite(testUserId, "article", testArticleId);
      const isFav = await favoritesDb.isFavorite(testUserId, "article", testArticleId);
      expect(isFav).toBe(false);
    });
  });

  describe("Analytics de Gestão Interna", () => {
    it("deve obter estatísticas gerais", async () => {
      const stats = await internalManagementAnalyticsDb.getInternalManagementStats();
      expect(stats).toHaveProperty("totalArticles");
      expect(stats).toHaveProperty("totalViews");
      expect(stats).toHaveProperty("totalDocuments");
      expect(stats).toHaveProperty("totalDownloads");
      expect(stats).toHaveProperty("totalAnnouncements");
      expect(stats).toHaveProperty("totalUsers");
      expect(stats.totalArticles).toBeGreaterThanOrEqual(0);
    });

    it("deve obter artigos mais vistos", async () => {
      const topArticles = await internalManagementAnalyticsDb.getTopViewedArticles(5);
      expect(Array.isArray(topArticles)).toBe(true);
    });

    it("deve obter documentos mais descarregados", async () => {
      const topDocs = await internalManagementAnalyticsDb.getTopDownloadedDocuments(5);
      expect(Array.isArray(topDocs)).toBe(true);
    });

    it("deve obter artigos recentes", async () => {
      const recentArticles = await internalManagementAnalyticsDb.getRecentArticles(30);
      expect(Array.isArray(recentArticles)).toBe(true);
    });

    it("deve obter documentos recentes", async () => {
      const recentDocs = await internalManagementAnalyticsDb.getRecentDocuments(30);
      expect(Array.isArray(recentDocs)).toBe(true);
    });
  });
});
