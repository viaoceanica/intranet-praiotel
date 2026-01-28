import { describe, it, expect, beforeAll } from "vitest";
import * as internalManagementDb from "./internalManagementDb";
import { seedInternalManagement } from "./seedInternalManagement";
import * as db from "./db";

describe("Melhorias de Gestão Interna", () => {
  let testUserId: number;

  beforeAll(async () => {
    // Criar utilizador de teste se não existir
    const users = await db.getAllUsers();
    if (users.length > 0) {
      testUserId = users[0].id;
    } else {
      throw new Error("Nenhum utilizador encontrado para testes");
    }
  });

  it("deve executar seed de categorias e conteúdo inicial", async () => {
    await seedInternalManagement(testUserId);

    // Verificar categorias de documentos
    const docCategories = await internalManagementDb.getAllDocumentCategories();
    expect(docCategories.length).toBeGreaterThanOrEqual(3);
    expect(docCategories.some((c: any) => c.name === "Recursos Humanos")).toBe(true);
    expect(docCategories.some((c: any) => c.name === "Técnico")).toBe(true);
    expect(docCategories.some((c: any) => c.name === "Administrativo")).toBe(true);

    // Verificar categorias de conhecimento
    const knowledgeCategories = await internalManagementDb.getAllKnowledgeCategories();
    expect(knowledgeCategories.length).toBeGreaterThanOrEqual(3);
    expect(knowledgeCategories.some((c: any) => c.name === "Tutoriais")).toBe(true);
    expect(knowledgeCategories.some((c: any) => c.name === "Formação")).toBe(true);
    expect(knowledgeCategories.some((c: any) => c.name === "FAQ")).toBe(true);

    // Verificar notícias criadas
    const news = await internalManagementDb.getAllNews();
    expect(news.length).toBeGreaterThanOrEqual(2);

    // Verificar acessos rápidos
    const quickAccess = await internalManagementDb.getAllQuickAccess();
    expect(quickAccess.length).toBeGreaterThanOrEqual(4);

    // Verificar artigos de conhecimento
    const articles = await internalManagementDb.getAllKnowledgeArticles();
    expect(articles.length).toBeGreaterThanOrEqual(5);
  });

  it("deve criar categorias de documentos com ícones", async () => {
    const categories = await internalManagementDb.getAllDocumentCategories();
    const rhCategory = categories.find((c: any) => c.name === "Recursos Humanos");
    expect(rhCategory).toBeDefined();
    expect(rhCategory.icon).toBe("Users");
  });

  it("deve criar artigos de conhecimento com tags", async () => {
    const articles = await internalManagementDb.getAllKnowledgeArticles();
    const tutorialArticle = articles.find((a: any) => a.title.includes("Criar um Novo Ticket"));
    expect(tutorialArticle).toBeDefined();
    expect(tutorialArticle.tags).toContain("tickets");
  });

  it("deve criar anúncio com prioridade alta", async () => {
    const announcements = await internalManagementDb.getAllAnnouncements();
    const securityAnnouncement = announcements.find((a: any) => a.title.includes("Segurança"));
    expect(securityAnnouncement).toBeDefined();
    expect(securityAnnouncement.priority).toBe("alta");
  });
});
