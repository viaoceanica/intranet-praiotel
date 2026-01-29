import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Knowledge Categories Management", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testCategoryId: number;

  beforeAll(() => {
    const ctx: TrpcContext = {
      user: { id: 1, name: "Admin Test", email: "admin@test.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    };
    caller = appRouter.createCaller(ctx);
  });

  it("should list all knowledge categories", async () => {
    const categories = await caller.knowledgeCategories.list();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("should create a new knowledge category", async () => {
    const result = await caller.knowledgeCategories.create({
      name: "Test Knowledge Category " + Date.now(),
      description: "Test description for knowledge",
      icon: "📚",
    });
    expect(result.id).toBeDefined();
    testCategoryId = result.id;
  });

  it("should update a knowledge category", async () => {
    const result = await caller.knowledgeCategories.update({
      id: testCategoryId,
      name: "Updated Test Knowledge Category",
      description: "Updated description",
      icon: "📖",
    });
    expect(result.success).toBe(true);
  });

  it("should delete a knowledge category without articles", async () => {
    const result = await caller.knowledgeCategories.delete({ id: testCategoryId });
    expect(result.success).toBe(true);
  });
});
