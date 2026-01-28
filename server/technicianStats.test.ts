import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as technicianStatsDb from "./technicianStatsDb";
import * as db from "./db";
import * as ticketsDb from "./ticketsDb";
import * as slaDb from "./slaDb";

describe("Technician Statistics", () => {
  let testTechnicianId: number;
  let testTicketId: number;

  beforeAll(async () => {
    // Criar técnico de teste
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    // Limpar utilizador de teste anterior se existir
    await database.delete(users).where(eq(users.email, "tech-test@praiotel.pt"));
    const techResult = await database.insert(users).values({
      email: "tech-test@praiotel.pt",
      passwordHash: "test",
      name: "T\u00e9cnico Teste",
      role: "tecnico",
      active: 1,
    });
    testTechnicianId = Number(techResult[0].insertId);

    // Criar ticket de teste atribuído ao técnico
    const { tickets } = await import("../drizzle/schema");
    const ticketResult = await database.insert(tickets).values({
      ticketNumber: "TEST-001",
      clientName: "Cliente Teste",
      equipment: "Equipamento Teste",
      problemType: "Teste",
      priority: "media",
      status: "resolvido",
      assignedToId: testTechnicianId,
      location: "Teste",
      description: "Teste",
      createdById: testTechnicianId,
      resolvedAt: new Date(Date.now() + 1000 * 60 * 60 * 2), // Resolvido em 2h
    });
    testTicketId = Number(ticketResult[0].insertId);

    // Garantir que existe configuração SLA para "media"
    const slaConfig = await slaDb.getSlaConfig("media");
    if (!slaConfig) {
      await slaDb.createSlaConfig({
        priority: "media",
        responseTimeHours: 4,
        resolutionTimeHours: 48,
      });
    }
  });

  afterAll(async () => {
    // Limpar dados de teste
    const database = await db.getDb();
    if (!database) return;

    const { tickets, users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    await database.delete(tickets).where(eq(tickets.id, testTicketId));
    await database.delete(users).where(eq(users.id, testTechnicianId));
  });

  it("should return technician stats with correct structure", async () => {
    const stats = await technicianStatsDb.getTechnicianStats(testTechnicianId);

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("technicianId", testTechnicianId);
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("abertos");
    expect(stats).toHaveProperty("emProgresso");
    expect(stats).toHaveProperty("resolvidos");
    expect(stats).toHaveProperty("avgResolutionTimeMs");
    expect(stats).toHaveProperty("ticketsWithinSla");
    expect(stats).toHaveProperty("ticketsBreachedSla");
    expect(stats).toHaveProperty("slaCompliancePercentage");
  });

  it("should calculate SLA compliance correctly", async () => {
    const stats = await technicianStatsDb.getTechnicianStats(testTechnicianId);

    expect(stats).toBeDefined();
    if (!stats) return;

    // O ticket foi resolvido em 2h, e o SLA para "media" é 48h, então está dentro do SLA
    expect(stats.ticketsWithinSla).toBeGreaterThanOrEqual(1);
    expect(stats.slaCompliancePercentage).toBeGreaterThan(0);
  });

  it("should return comparison with team averages", async () => {
    const comparison = await technicianStatsDb.getAllTechniciansComparison();

    expect(comparison).toBeDefined();
    expect(comparison).toHaveProperty("technicians");
    expect(comparison).toHaveProperty("teamAverages");
    expect(Array.isArray(comparison.technicians)).toBe(true);

    // Verificar estrutura das médias da equipa
    expect(comparison.teamAverages).toHaveProperty("totalTickets");
    expect(comparison.teamAverages).toHaveProperty("resolvedTickets");
    expect(comparison.teamAverages).toHaveProperty("avgResolutionTimeMs");
    expect(comparison.teamAverages).toHaveProperty("avgSlaCompliance");
  });

  it("should sort technicians by SLA compliance", async () => {
    const comparison = await technicianStatsDb.getAllTechniciansComparison();

    expect(comparison).toBeDefined();
    if (comparison.technicians.length > 1) {
      for (let i = 0; i < comparison.technicians.length - 1; i++) {
        expect(comparison.technicians[i].slaCompliancePercentage).toBeGreaterThanOrEqual(
          comparison.technicians[i + 1].slaCompliancePercentage
        );
      }
    }
  });

  it("should return monthly history with correct structure", async () => {
    const history = await technicianStatsDb.getTechnicianMonthlyHistory(testTechnicianId);

    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);

    if (history.length > 0) {
      const entry = history[0];
      expect(entry).toHaveProperty("month");
      expect(entry).toHaveProperty("resolved");
      expect(entry).toHaveProperty("withinSla");
      expect(entry).toHaveProperty("slaPercentage");
    }
  });

  it("should handle technician with no tickets", async () => {
    const stats = await technicianStatsDb.getTechnicianStats(99999);

    expect(stats).toBeDefined();
    if (!stats) return;

    expect(stats.total).toBe(0);
    expect(stats.resolvidos).toBe(0);
    expect(stats.slaCompliancePercentage).toBe(0);
  });
});
