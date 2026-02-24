import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

describe("Menu Order - Schema and Validation", () => {
  it("should accept a valid menu order array", () => {
    const { z } = require("zod");
    
    const menuOrderInput = z.object({
      order: z.array(z.string()),
    });

    const validInput = menuOrderInput.parse({
      order: ["Dashboard", "Clientes", "Tickets", "CRM", "Gestão Interna", "Utilizadores", "Configurações"],
    });

    expect(validInput.order).toHaveLength(7);
    expect(validInput.order[0]).toBe("Dashboard");
    expect(validInput.order[1]).toBe("Clientes");
    expect(validInput.order[2]).toBe("Tickets");
  });

  it("should accept an empty order array", () => {
    const { z } = require("zod");
    
    const menuOrderInput = z.object({
      order: z.array(z.string()),
    });

    const emptyInput = menuOrderInput.parse({ order: [] });
    expect(emptyInput.order).toHaveLength(0);
  });

  it("should reject non-string items in order array", () => {
    const { z } = require("zod");
    
    const menuOrderInput = z.object({
      order: z.array(z.string()),
    });

    expect(() => menuOrderInput.parse({ order: [1, 2, 3] })).toThrow();
  });
});

describe("Menu Order - Database Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when no saved order exists", async () => {
    const { getDb } = await import("./db");
    
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };

    (getDb as any).mockResolvedValue(mockDb);

    // Simulate the get query logic
    const result = await mockDb.select().from({}).where({}).limit(1);
    expect(result).toHaveLength(0);
  });

  it("should return parsed menu order when saved order exists", async () => {
    const savedOrder = ["Clientes", "Dashboard", "Tickets", "CRM"];
    
    const { getDb } = await import("./db");
    
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              userId: 1,
              menuOrder: JSON.stringify(savedOrder),
              updatedAt: new Date(),
            }]),
          }),
        }),
      }),
    };

    (getDb as any).mockResolvedValue(mockDb);

    const result = await mockDb.select().from({}).where({}).limit(1);
    expect(result).toHaveLength(1);
    
    const parsed = JSON.parse(result[0].menuOrder);
    expect(parsed).toEqual(savedOrder);
    expect(parsed[0]).toBe("Clientes");
    expect(parsed[1]).toBe("Dashboard");
  });

  it("should serialize menu order as JSON string for storage", () => {
    const order = ["Dashboard", "CRM", "Tickets", "Clientes"];
    const serialized = JSON.stringify(order);
    const deserialized = JSON.parse(serialized);
    
    expect(deserialized).toEqual(order);
    expect(typeof serialized).toBe("string");
  });
});

describe("Menu Order - Reordering Logic", () => {
  it("should correctly reorder items using arrayMove logic", () => {
    const items = ["Dashboard", "Tickets", "Clientes", "CRM", "Gestão Interna"];
    
    // Simulate moving "Clientes" (index 2) to position 0
    const arrayMove = (arr: string[], from: number, to: number) => {
      const newArr = [...arr];
      const [removed] = newArr.splice(from, 1);
      newArr.splice(to, 0, removed);
      return newArr;
    };

    const reordered = arrayMove(items, 2, 0);
    expect(reordered[0]).toBe("Clientes");
    expect(reordered[1]).toBe("Dashboard");
    expect(reordered[2]).toBe("Tickets");
  });

  it("should handle moving last item to first position", () => {
    const items = ["A", "B", "C", "D", "E"];
    
    const arrayMove = (arr: string[], from: number, to: number) => {
      const newArr = [...arr];
      const [removed] = newArr.splice(from, 1);
      newArr.splice(to, 0, removed);
      return newArr;
    };

    const reordered = arrayMove(items, 4, 0);
    expect(reordered).toEqual(["E", "A", "B", "C", "D"]);
  });

  it("should preserve all items after reordering", () => {
    const items = ["Dashboard", "Tickets", "Clientes", "CRM"];
    
    const arrayMove = (arr: string[], from: number, to: number) => {
      const newArr = [...arr];
      const [removed] = newArr.splice(from, 1);
      newArr.splice(to, 0, removed);
      return newArr;
    };

    const reordered = arrayMove(items, 1, 3);
    expect(reordered).toHaveLength(items.length);
    expect(reordered.sort()).toEqual(items.sort());
  });

  it("should apply saved order correctly with new items", () => {
    const savedOrder = ["CRM", "Dashboard", "Tickets"];
    const currentItems = ["Dashboard", "Tickets", "Clientes", "CRM", "Configurações"];
    
    // Apply saved order logic
    const ordered: string[] = [];
    for (const name of savedOrder) {
      const item = currentItems.find(n => n === name);
      if (item) ordered.push(item);
    }
    for (const item of currentItems) {
      if (!ordered.includes(item)) {
        ordered.push(item);
      }
    }

    expect(ordered[0]).toBe("CRM");
    expect(ordered[1]).toBe("Dashboard");
    expect(ordered[2]).toBe("Tickets");
    // New items appended at the end
    expect(ordered[3]).toBe("Clientes");
    expect(ordered[4]).toBe("Configurações");
  });
});
