import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Tags System", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let adminContext: Context;

  beforeAll(() => {
    adminContext = {
      user: {
        id: 1,
        email: "admin@praiotel.pt",
        name: "Admin",
        role: "admin",
      },
    };
    caller = appRouter.createCaller(adminContext);
  });

  it("should create a new tag", async () => {
    const result = await caller.tags.create({
      name: "Test Tag",
      color: "#FF5733",
    });
    expect(result.success).toBe(true);
  });

  it("should list all tags", async () => {
    const tags = await caller.tags.list();
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
  });

  it("should update a tag", async () => {
    const tags = await caller.tags.list();
    const tag = tags.find((t) => t.name === "Test Tag");
    if (tag) {
      const result = await caller.tags.update({
        id: tag.id,
        name: "Updated Tag",
        color: "#33FF57",
      });
      expect(result.success).toBe(true);
    }
  });

  it("should delete a tag", async () => {
    const tags = await caller.tags.list();
    const tag = tags.find((t) => t.name === "Updated Tag");
    if (tag) {
      const result = await caller.tags.delete({ id: tag.id });
      expect(result.success).toBe(true);
    }
  });
});
