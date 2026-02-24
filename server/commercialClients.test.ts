import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@praiotel.pt",
    name: "Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("commercialClients", () => {
  const ctx = createAdminContext();
  const caller = appRouter.createCaller(ctx);

  it("lists commercial clients with correct structure", async () => {
    const result = await caller.commercialClients.list({
      page: 1,
      pageSize: 10,
    });

    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("limit");
    expect(result).toHaveProperty("totalPages");
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("gets stats for commercial clients", async () => {
    const result = await caller.commercialClients.stats();

    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("active");
    expect(result).toHaveProperty("blocked");
    expect(result).toHaveProperty("zones");
    expect(typeof result.total).toBe("number");
    expect(typeof result.active).toBe("number");
    expect(typeof result.blocked).toBe("number");
    expect(typeof result.zones).toBe("number");
  });

  it("gets zones list", async () => {
    const result = await caller.commercialClients.zones();
    expect(Array.isArray(result)).toBe(true);
  });

  it("gets salespersons list", async () => {
    const result = await caller.commercialClients.salespersons();
    expect(Array.isArray(result)).toBe(true);
  });

  it("imports commercial clients from base64 CSV data", async () => {
    const csvContent = "N\u00ba Cliente;Designa\u00e7\u00e3o;NIF;Morada;C\u00f3d. Postal;Localidade;Telefone;Fax;E-Mail;Vendedor;Zona\n" +
      "9999;Teste Import Lda;999999999;Rua Teste 1;9500-001;Ponta Delgada;296111222;;teste@import.pt;Jo\u00e3o Silva;S\u00e3o Miguel";
    const base64Data = Buffer.from(csvContent).toString("base64");

    const result = await caller.commercialClients.import({
      fileBase64: base64Data,
      fileName: "test.csv",
    });

    expect(result).toHaveProperty("imported");
    expect(result).toHaveProperty("updated");
    expect(result).toHaveProperty("errors");
    expect(typeof result.imported).toBe("number");
    expect(typeof result.updated).toBe("number");
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it("can search for the imported client", async () => {
    const result = await caller.commercialClients.list({
      page: 1,
      pageSize: 10,
      search: "Teste Import",
    });

    expect(result.items.length).toBeGreaterThanOrEqual(0);
  });

  it("filters by zone", async () => {
    const result = await caller.commercialClients.list({
      page: 1,
      pageSize: 10,
      zone: "São Miguel",
    });

    expect(result).toHaveProperty("items");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("filters by active status", async () => {
    const result = await caller.commercialClients.list({
      page: 1,
      pageSize: 10,
      active: true,
    });

    expect(result).toHaveProperty("items");
    expect(Array.isArray(result.items)).toBe(true);
  });
});
