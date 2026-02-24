import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@praiotel.pt",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createNonAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@praiotel.pt",
    name: "Regular User",
    loginMethod: "manus",
    role: "tecnico",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("systemSettings", () => {
  it("should initialize default settings", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.systemSettings.initialize();
    expect(result).toEqual({ success: true });
  });

  it("should list all settings after initialization", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const settings = await caller.systemSettings.list();
    expect(Array.isArray(settings)).toBe(true);
    expect(settings.length).toBeGreaterThan(0);
  });

  it("should get settings by category", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const generalSettings = await caller.systemSettings.getByCategory({ category: "general" });
    expect(Array.isArray(generalSettings)).toBe(true);
    expect(generalSettings.length).toBeGreaterThan(0);
    
    // Verificar que todas as configurações são da categoria "general"
    generalSettings.forEach((s) => {
      expect(s.category).toBe("general");
    });
  });

  it("should get email settings by category", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const emailSettings = await caller.systemSettings.getByCategory({ category: "email" });
    expect(Array.isArray(emailSettings)).toBe(true);
    expect(emailSettings.length).toBeGreaterThan(0);
    
    emailSettings.forEach((s) => {
      expect(s.category).toBe("email");
    });
  });

  it("should get a specific setting by key", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const setting = await caller.systemSettings.get({ key: "company_name" });
    expect(setting).not.toBeNull();
    expect(setting?.settingKey).toBe("company_name");
  });

  it("should upsert a setting", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.systemSettings.upsert({
      key: "company_name",
      value: "Praiotel Açores",
    });
    expect(result).toEqual({ success: true });

    // Verificar que o valor foi atualizado
    const updated = await caller.systemSettings.get({ key: "company_name" });
    expect(updated?.settingValue).toBe("Praiotel Açores");
  });

  it("should update multiple settings at once", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.systemSettings.updateMultiple({
      settings: [
        { key: "company_phone", value: "+351 296 000 000" },
        { key: "company_website", value: "https://www.praiotel.pt" },
      ],
    });
    expect(result).toEqual({ success: true });

    // Verificar valores
    const phone = await caller.systemSettings.get({ key: "company_phone" });
    expect(phone?.settingValue).toBe("+351 296 000 000");
    
    const website = await caller.systemSettings.get({ key: "company_website" });
    expect(website?.settingValue).toBe("https://www.praiotel.pt");
  });

  it("should reject non-admin users", async () => {
    const { ctx } = createNonAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.systemSettings.list()).rejects.toThrow();
  });
});
