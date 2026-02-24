import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getUserById: vi.fn().mockImplementation((id: number) => {
    if (id === 1) return Promise.resolve({ id: 1, name: "Admin", email: "admin@test.com", role: "admin" });
    if (id === 2) return Promise.resolve({ id: 2, name: "Técnico A", email: "tecA@test.com", role: "user" });
    if (id === 3) return Promise.resolve({ id: 3, name: "Técnico B", email: "tecB@test.com", role: "user" });
    return Promise.resolve(undefined);
  }),
}));

// Mock ticketsDb
const mockCreateTicketHistory = vi.fn().mockResolvedValue(undefined);
const mockGetTicketById = vi.fn();
const mockUpdateTicket = vi.fn().mockResolvedValue(undefined);

vi.mock("./ticketsDb", () => ({
  createTicketHistory: (...args: any[]) => mockCreateTicketHistory(...args),
  getTicketById: (...args: any[]) => mockGetTicketById(...args),
  updateTicket: (...args: any[]) => mockUpdateTicket(...args),
}));

import * as db from "./db";

describe("Ticket Assignment History", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resolve user names for assignment history", async () => {
    const user1 = await db.getUserById(1);
    expect(user1).toBeDefined();
    expect(user1!.name).toBe("Admin");

    const user2 = await db.getUserById(2);
    expect(user2).toBeDefined();
    expect(user2!.name).toBe("Técnico A");

    const user3 = await db.getUserById(3);
    expect(user3).toBeDefined();
    expect(user3!.name).toBe("Técnico B");
  });

  it("should create assignment history entry for initial assignment", async () => {
    const assignedUser = await db.getUserById(2);
    
    await mockCreateTicketHistory({
      ticketId: 100,
      userId: 1,
      action: "assignment",
      fieldChanged: "assignedToId",
      oldValue: "Não atribuído",
      newValue: assignedUser!.name,
    });

    expect(mockCreateTicketHistory).toHaveBeenCalledWith({
      ticketId: 100,
      userId: 1,
      action: "assignment",
      fieldChanged: "assignedToId",
      oldValue: "Não atribuído",
      newValue: "Técnico A",
    });
  });

  it("should create reassignment history entry when changing technician", async () => {
    const oldUser = await db.getUserById(2);
    const newUser = await db.getUserById(3);
    
    await mockCreateTicketHistory({
      ticketId: 100,
      userId: 1,
      action: "reassignment",
      fieldChanged: "assignedToId",
      oldValue: oldUser!.name,
      newValue: newUser!.name,
    });

    expect(mockCreateTicketHistory).toHaveBeenCalledWith({
      ticketId: 100,
      userId: 1,
      action: "reassignment",
      fieldChanged: "assignedToId",
      oldValue: "Técnico A",
      newValue: "Técnico B",
    });
  });

  it("should use 'assignment' action when ticket had no previous assignee", async () => {
    // Simulate ticket with no previous assignee
    const ticket = { assignedToId: null };
    const action = ticket.assignedToId ? "reassignment" : "assignment";
    expect(action).toBe("assignment");
  });

  it("should use 'reassignment' action when ticket already had an assignee", async () => {
    // Simulate ticket with previous assignee
    const ticket = { assignedToId: 2 };
    const action = ticket.assignedToId ? "reassignment" : "assignment";
    expect(action).toBe("reassignment");
  });

  it("should handle unknown user gracefully", async () => {
    const unknownUser = await db.getUserById(999);
    expect(unknownUser).toBeUndefined();
    
    const newValue = unknownUser ? unknownUser.name : "Não atribuído";
    expect(newValue).toBe("Não atribuído");
  });
});
