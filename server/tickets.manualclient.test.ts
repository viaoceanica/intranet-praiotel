import { describe, it, expect, beforeAll } from "vitest";
import * as clientsDb from "./clientsDb";
import * as ticketsDb from "./ticketsDb";

describe("Manual Client Creation on Ticket", () => {
  let createdClientId: number | undefined;
  let createdTicketId: number | undefined;

  it("should create a new client when isManualClient is true", async () => {
    // Simular criação de cliente manual
    const clientName = `Cliente Teste Manual ${Date.now()}`;
    
    // Criar cliente com dados mínimos (como faz o backend)
    const newClient = await clientsDb.createClient({
      designation: clientName,
      address: "",
      primaryEmail: `cliente_${Date.now()}@temp.praiotel.pt`,
      nif: `TEMP${Date.now()}`,
      source: "direto",
    });
    
    createdClientId = Number(newClient[0].insertId);
    
    expect(createdClientId).toBeGreaterThan(0);
    
    // Verificar se o cliente foi criado
    const client = await clientsDb.getClientById(createdClientId);
    expect(client).toBeDefined();
    expect(client?.designation).toBe(clientName);
    expect(client?.nif).toContain("TEMP");
    expect(client?.primaryEmail).toContain("@temp.praiotel.pt");
  });

  it("should find the manually created client in the clients list", async () => {
    if (!createdClientId) {
      throw new Error("Client was not created in previous test");
    }

    const allClients = await clientsDb.getAllClients();
    const foundClient = allClients.find(c => c.id === createdClientId);
    
    expect(foundClient).toBeDefined();
    expect(foundClient?.designation).toContain("Cliente Teste Manual");
  });

  it("should create a ticket with the manually created client", async () => {
    if (!createdClientId) {
      throw new Error("Client was not created in previous test");
    }

    const ticketNumber = await ticketsDb.generateTicketNumber();
    
    await ticketsDb.createTicket({
      ticketNumber,
      clientId: createdClientId,
      clientType: "assistencia",
      clientName: "Cliente Teste Manual",
      equipment: "Máquina de café teste",
      problemType: "Avaria",
      priority: "media",
      status: "aberto",
      location: "São Miguel",
      description: "Teste de criação de cliente manual",
      createdById: 1, // Assumindo que existe um utilizador com ID 1
    });

    const ticket = await ticketsDb.getTicketByNumber(ticketNumber);
    expect(ticket).toBeDefined();
    expect(ticket?.clientId).toBe(createdClientId);
    expect(ticket?.clientName).toBe("Cliente Teste Manual");
    
    createdTicketId = ticket?.id;
  });

  it("should link the ticket to the correct client", async () => {
    if (!createdClientId || !createdTicketId) {
      throw new Error("Client or ticket was not created in previous tests");
    }

    const client = await clientsDb.getClientById(createdClientId);
    const ticket = await ticketsDb.getTicketById(createdTicketId);
    
    expect(client).toBeDefined();
    expect(ticket).toBeDefined();
    expect(ticket?.clientId).toBe(client?.id);
  });
});
