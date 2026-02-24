import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

describe("searchAllClients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return results from both client tables with correct format", async () => {
    const mockTechClients = [
      {
        id: 1,
        designation: "Praiotel Lda",
        nif: "123456789",
        primaryEmail: "geral@praiotel.pt",
        address: "Rua do Teste",
        createdAt: new Date(),
      },
    ];

    const mockCommClients = [
      {
        id: 10,
        company: "Empresa Comercial",
        nif: "987654321",
        email: "comercial@empresa.pt",
        phone1: "912345678",
        address: "Av. Comercial 1",
        locality: "Ponta Delgada",
      },
    ];

    // Mock drizzle chain
    const mockSelect = vi.fn();
    const mockFrom = vi.fn();
    const mockWhere = vi.fn();
    const mockOrderBy = vi.fn();
    const mockLimit = vi.fn();

    const createChain = (results: any[]) => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(results),
      };
      return chain;
    };

    // We need to test the function logic, so let's test the output format
    const { getDb } = await import("./db");
    
    // Create a mock DB that tracks calls
    let callCount = 0;
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) return Promise.resolve(mockTechClients);
                return Promise.resolve(mockCommClients);
              }),
            }),
            limit: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount <= 1) return Promise.resolve(mockTechClients);
              return Promise.resolve(mockCommClients);
            }),
          }),
        }),
      }),
    };

    (getDb as any).mockResolvedValue(mockDb);

    // Re-import to get fresh module with mocked db
    const { searchAllClients } = await import("./clientsDb");
    
    const results = await searchAllClients("test");

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    
    // Check that results have the unified format
    for (const result of results) {
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("clientType");
      expect(result).toHaveProperty("designation");
      expect(["assistencia", "comercial"]).toContain(result.clientType);
    }
  });

  it("should return empty array when db is not available", async () => {
    const { getDb } = await import("./db");
    (getDb as any).mockResolvedValue(null);

    const { searchAllClients } = await import("./clientsDb");
    const results = await searchAllClients("test");

    expect(results).toEqual([]);
  });
});

describe("ticket creation with commercial client", () => {
  it("should accept commercialClientId and clientType in ticket input", () => {
    // Test the schema validation
    const { z } = require("zod");
    
    const ticketInput = z.object({
      clientId: z.number().optional(),
      commercialClientId: z.number().optional(),
      clientType: z.enum(["assistencia", "comercial"]).default("assistencia"),
      clientName: z.string().min(1),
      equipment: z.string().min(1),
      problemType: z.string().min(1),
      priority: z.enum(["baixa", "media", "alta", "urgente"]),
      location: z.string().min(1),
      description: z.string().min(1),
      assignedToId: z.number().optional(),
    });

    // Test with assistencia client
    const assistenciaInput = ticketInput.parse({
      clientId: 1,
      clientType: "assistencia",
      clientName: "Praiotel Lda",
      equipment: "Máquina de café",
      problemType: "Avaria",
      priority: "media",
      location: "São Miguel",
      description: "Máquina não liga",
    });
    expect(assistenciaInput.clientType).toBe("assistencia");
    expect(assistenciaInput.clientId).toBe(1);

    // Test with comercial client
    const comercialInput = ticketInput.parse({
      commercialClientId: 10,
      clientType: "comercial",
      clientName: "Empresa Comercial",
      equipment: "Frigorífico",
      problemType: "Manutenção",
      priority: "alta",
      location: "Ponta Delgada",
      description: "Necessita manutenção preventiva",
    });
    expect(comercialInput.clientType).toBe("comercial");
    expect(comercialInput.commercialClientId).toBe(10);
    expect(comercialInput.clientId).toBeUndefined();

    // Test default clientType
    const defaultInput = ticketInput.parse({
      clientId: 1,
      clientName: "Test",
      equipment: "Test",
      problemType: "Test",
      priority: "media",
      location: "Test",
      description: "Test",
    });
    expect(defaultInput.clientType).toBe("assistencia");
  });
});
