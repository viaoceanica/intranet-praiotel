import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetDb } = vi.hoisted(() => ({
  mockGetDb: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: mockGetDb,
}));

import { createTicketWithGeneratedNumber } from "./ticketsDb";

describe("ticket number allocation", () => {
  const year = new Date().getFullYear();
  let ticketNumbers: string[];
  let initialReadCount: number;

  const mockDb = {
    select: vi.fn(() => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: async () => {
              // Give the first two concurrent callers the same snapshot, which
              // reproduces the pre-fix collision window.
              if (initialReadCount < 2) {
                initialReadCount++;
                return [];
              }

              const sortedTicketNumbers = [...ticketNumbers].sort();
              const lastTicketNumber = sortedTicketNumbers[sortedTicketNumbers.length - 1];
              return lastTicketNumber ? [{ ticketNumber: lastTicketNumber }] : [];
            },
          }),
        }),
      }),
    })),
    insert: vi.fn(() => ({
      values: async (ticket: { ticketNumber: string }) => {
        if (ticketNumbers.includes(ticket.ticketNumber)) {
          const duplicateError = new Error(`Duplicate entry '${ticket.ticketNumber}' for key 'tickets.ticketNumber'`) as Error & { code: string };
          duplicateError.code = "ER_DUP_ENTRY";
          const error = new Error("Failed query") as Error & { cause: unknown };
          error.cause = duplicateError;
          throw error;
        }

        ticketNumbers.push(ticket.ticketNumber);
      },
    })),
  };

  const ticketData = {
    clientName: "Cliente de teste",
    equipment: "Equipamento de teste",
    problemType: "Teste",
    priority: "media",
    status: "aberto" as const,
    location: "Terceira",
    description: "Teste de concorrência",
    createdById: 1,
  };

  beforeEach(() => {
    ticketNumbers = [];
    initialReadCount = 0;
    vi.clearAllMocks();
    mockGetDb.mockResolvedValue(mockDb);
  });

  it("creates valid, unique ticket numbers during concurrent creation", async () => {
    const created = await Promise.all([
      createTicketWithGeneratedNumber(ticketData),
      createTicketWithGeneratedNumber(ticketData),
    ]);

    expect(created.map(ticket => ticket.ticketNumber)).toEqual([
      `TK${year}-0001`,
      `TK${year}-0002`,
    ]);
    expect(new Set(ticketNumbers).size).toBe(2);
    expect(ticketNumbers).toHaveLength(2);
  });

  it("creates the next valid ticket number for a normal creation", async () => {
    ticketNumbers.push(`TK${year}-0041`);
    initialReadCount = 2;

    await expect(createTicketWithGeneratedNumber(ticketData)).resolves.toEqual({
      ticketNumber: `TK${year}-0042`,
    });
  });
});