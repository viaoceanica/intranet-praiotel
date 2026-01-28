import { describe, it, expect, beforeAll } from "vitest";
import * as internalManagementDb from "./internalManagementDb";

describe("Sistema de Gestão Interna", () => {
  let testNewsId: number;
  let testQuickAccessId: number;
  let testAnnouncementId: number;
  let testMessageId: number;
  let testDocCategoryId: number;
  let testKnowledgeCategoryId: number;
  let testArticleId: number;

  beforeAll(async () => {
    // Criar dados de teste
    testNewsId = await internalManagementDb.createNews({
      title: "Notícia de Teste",
      content: "Conteúdo da notícia de teste",
      authorId: 1,
    });

    testQuickAccessId = await internalManagementDb.createQuickAccess({
      name: "Acesso Teste",
      url: "https://example.com",
      icon: "FileText",
      createdById: 1,
    });

    testAnnouncementId = await internalManagementDb.createAnnouncement({
      title: "Anúncio de Teste",
      content: "Conteúdo do anúncio",
      priority: "normal",
      authorId: 1,
    });

    testMessageId = await internalManagementDb.createBulletinMessage({
      message: "Mensagem de teste",
      authorId: 1,
    });

    testDocCategoryId = await internalManagementDb.createDocumentCategory({
      name: "Categoria Teste",
      icon: "Folder",
    });

    testKnowledgeCategoryId = await internalManagementDb.createKnowledgeCategory({
      name: "Tutoriais Teste",
      icon: "BookOpen",
      displayOrder: 1,
    });

    testArticleId = await internalManagementDb.createKnowledgeArticle({
      title: "Artigo de Teste",
      content: "Conteúdo do artigo de teste",
      categoryId: testKnowledgeCategoryId,
      authorId: 1,
    });
  });

  it("deve criar e obter notícias internas", async () => {
    const news = await internalManagementDb.getNewsById(testNewsId);
    expect(news).toBeDefined();
    expect(news.title).toBe("Notícia de Teste");
  });

  it("deve listar acessos rápidos", async () => {
    const accessList = await internalManagementDb.getAllQuickAccess();
    expect(accessList.length).toBeGreaterThan(0);
    expect(accessList.some((a: any) => a.id === testQuickAccessId)).toBe(true);
  });

  it("deve criar e listar anúncios", async () => {
    const announcements = await internalManagementDb.getAllAnnouncements();
    expect(announcements.length).toBeGreaterThan(0);
    expect(announcements.some((a: any) => a.id === testAnnouncementId)).toBe(true);
  });

  it("deve criar mensagem no mural e dar like", async () => {
    const messages = await internalManagementDb.getAllBulletinMessages();
    expect(messages.length).toBeGreaterThan(0);

    // Dar like
    const result = await internalManagementDb.likeBulletinMessage(testMessageId, 1);
    expect(result.action).toBe("liked");

    // Verificar se deu like
    const hasLiked = await internalManagementDb.hasUserLikedMessage(testMessageId, 1);
    expect(hasLiked).toBe(true);
  });

  it("deve criar categoria de documentos", async () => {
    const categories = await internalManagementDb.getAllDocumentCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.some((c: any) => c.id === testDocCategoryId)).toBe(true);
  });

  it("deve criar categoria de conhecimento", async () => {
    const categories = await internalManagementDb.getAllKnowledgeCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.some((c: any) => c.id === testKnowledgeCategoryId)).toBe(true);
  });

  it("deve criar e obter artigo de conhecimento", async () => {
    const article = await internalManagementDb.getKnowledgeArticleById(testArticleId);
    expect(article).toBeDefined();
    expect(article.title).toBe("Artigo de Teste");
  });

  it("deve pesquisar artigos por termo", async () => {
    const results = await internalManagementDb.searchKnowledgeArticles("Teste");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((a: any) => a.id === testArticleId)).toBe(true);
  });
});
