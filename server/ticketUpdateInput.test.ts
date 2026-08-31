import { describe, expect, it } from "vitest";
import { ticketUpdateInputSchema } from "./ticketUpdateInput";

describe("ticket update input", () => {
  it("accepts an unassigned ticket from Quick Edit", () => {
    const result = ticketUpdateInputSchema.safeParse({
      id: 42,
      status: "em_progresso",
      priority: "alta",
      assignedToId: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignedToId).toBeNull();
    }
  });

  it("continues to accept a technician assignment", () => {
    const result = ticketUpdateInputSchema.safeParse({
      id: 42,
      assignedToId: 7,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignedToId).toBe(7);
    }
  });
});
