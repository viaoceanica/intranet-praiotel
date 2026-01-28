import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Document Categories Management", () => {
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

  it("should list all document categories", async () => {
    const categories = await caller.documentCategories.list();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("should create a new document category", async () => {
    const result = await caller.documentCategories.create({
      name: "Test Category " + Date.now(),
      description: "Test description",
      icon: "📦",
    });
    expect(result.id).toBeDefined();
    testCategoryId = result.id;
  });

  it("should update a document category", async () => {
    const result = await caller.documentCategories.update({
      id: testCategoryId,
      name: "Updated Test Category",
      description: "Updated description",
      icon: "📝",
    });
    expect(result.success).toBe(true);
  });

  it("should delete a document category without documents", async () => {
    const result = await caller.documentCategories.delete({ id: testCategoryId });
    expect(result.success).toBe(true);
  });

  // Note: Test for deleting category with documents would require
  // creating a document first, which is beyond the scope of this test suite
});
