import { describe, expect, it, beforeEach } from "vitest";
import {
  getScoringRules,
  updateScoringRules,
  resetScoringRules,
  type LeadScoringRule,
} from "./crmLeadScoringDb";

describe("CRM Lead Scoring - Regras", () => {
  beforeEach(() => {
    resetScoringRules();
  });

  it("retorna as regras padrão quando não há customizações", () => {
    const rules = getScoringRules();
    expect(rules).toBeDefined();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });

  it("cada regra padrão tem os campos obrigatórios", () => {
    const rules = getScoringRules();
    for (const rule of rules) {
      expect(rule).toHaveProperty("id");
      expect(rule).toHaveProperty("name");
      expect(rule).toHaveProperty("description");
      expect(rule).toHaveProperty("field");
      expect(rule).toHaveProperty("condition");
      expect(rule).toHaveProperty("value");
      expect(rule).toHaveProperty("points");
      expect(rule).toHaveProperty("active");
      expect(typeof rule.id).toBe("string");
      expect(typeof rule.name).toBe("string");
      expect(typeof rule.points).toBe("number");
      expect(typeof rule.active).toBe("boolean");
    }
  });

  it("as regras padrão incluem regras essenciais de CRM", () => {
    const rules = getScoringRules();
    const ruleIds = rules.map(r => r.id);
    expect(ruleIds).toContain("has_email");
    expect(ruleIds).toContain("has_phone");
    expect(ruleIds).toContain("has_company");
    expect(ruleIds).toContain("has_budget");
    expect(ruleIds).toContain("status_qualified");
    expect(ruleIds).toContain("has_activities");
    expect(ruleIds).toContain("has_opportunity");
  });

  it("todas as regras padrão estão ativas por defeito", () => {
    const rules = getScoringRules();
    for (const rule of rules) {
      expect(rule.active).toBe(true);
    }
  });

  it("todos os pontos são positivos e <= 50", () => {
    const rules = getScoringRules();
    for (const rule of rules) {
      expect(rule.points).toBeGreaterThan(0);
      expect(rule.points).toBeLessThanOrEqual(50);
    }
  });

  it("permite atualizar regras customizadas", () => {
    const customRules: LeadScoringRule[] = [
      {
        id: "custom_1",
        name: "Regra Personalizada",
        description: "Teste",
        field: "email",
        condition: "not_empty",
        value: "",
        points: 25,
        active: true,
      },
    ];

    updateScoringRules(customRules);
    const rules = getScoringRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].id).toBe("custom_1");
    expect(rules[0].points).toBe(25);
  });

  it("permite resetar para as regras padrão", () => {
    const customRules: LeadScoringRule[] = [
      {
        id: "custom_1",
        name: "Regra Personalizada",
        description: "Teste",
        field: "email",
        condition: "not_empty",
        value: "",
        points: 25,
        active: true,
      },
    ];

    updateScoringRules(customRules);
    expect(getScoringRules()).toHaveLength(1);

    resetScoringRules();
    const rules = getScoringRules();
    expect(rules.length).toBeGreaterThan(1);
    expect(rules.some(r => r.id === "has_email")).toBe(true);
  });

  it("as condições são válidas", () => {
    const validConditions = ["equals", "not_empty", "greater_than", "contains", "activity_count", "has_opportunity"];
    const rules = getScoringRules();
    for (const rule of rules) {
      expect(validConditions).toContain(rule.condition);
    }
  });

  it("a soma total dos pontos padrão é razoável (entre 50 e 200)", () => {
    const rules = getScoringRules();
    const totalPoints = rules.reduce((sum, r) => sum + r.points, 0);
    expect(totalPoints).toBeGreaterThanOrEqual(50);
    expect(totalPoints).toBeLessThanOrEqual(200);
  });
});

describe("CRM Lead Scoring - Router Integration", () => {
  it("o módulo crmLeadScoringDb exporta todas as funções necessárias", async () => {
    const mod = await import("./crmLeadScoringDb");
    expect(typeof mod.getScoringRules).toBe("function");
    expect(typeof mod.updateScoringRules).toBe("function");
    expect(typeof mod.resetScoringRules).toBe("function");
    expect(typeof mod.calculateLeadScore).toBe("function");
    expect(typeof mod.recalculateAllLeadScores).toBe("function");
    expect(typeof mod.getScoreDistribution).toBe("function");
  });
});
