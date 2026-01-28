import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import * as notificationsDb from "./notificationsDb";
import * as notificationHelpers from "./notificationHelpers";
import { users, tickets, notifications } from "../drizzle/schema";
import { eq, like } from "drizzle-orm";

describe("Gatilhos de Notificação", () => {
  let testUserId: number;
  let testTicketId: number;
  let testTicketNumber: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Limpar dados de teste anteriores
    await db.delete(notifications).where(like(notifications.message, "%teste%"));
    await db.delete(tickets).where(like(tickets.ticketNumber, "TEST-%"));
    await db.delete(users).where(eq(users.email, "test-tech@praiotel.pt"));
    
    // Criar utilizador de teste
    const userResult = await db.insert(users).values({
      email: "test-tech@praiotel.pt",
      name: "Técnico Teste",
      passwordHash: "hash",
      role: "tecnico",
      active: true,
    });
    testUserId = Number(userResult[0].insertId);
    
    // Criar ticket de teste
    testTicketNumber = "TEST-001";
    const ticketResult = await db.insert(tickets).values({
      ticketNumber: testTicketNumber,
      clientName: "Cliente Teste",
      equipment: "Equipamento Teste",
      problemType: "Problema Teste",
      priority: "media",
      status: "aberto",
      location: "São Miguel",
      description: "Descrição teste",
      createdById: testUserId,
      createdAt: new Date(),
    });
    testTicketId = Number(ticketResult[0].insertId);
  });

  it("deve enviar notificação ao atribuir ticket", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Limpar notificações anteriores
    await db.delete(notifications).where(eq(notifications.userId, testUserId));
    
    // Atribuir ticket
    await notificationHelpers.notifyTicketAssigned(testTicketId, testTicketNumber, testUserId);
    
    // Verificar notificação criada
    const notifs = await notificationsDb.getUserNotifications(testUserId);
    expect(notifs.length).toBeGreaterThan(0);
    
    const notification = notifs[0];
    expect(notification.type).toBe("ticket_assigned");
    expect(notification.title).toBe("🎫 Ticket atribuído");
    expect(notification.message).toContain(testTicketNumber);
  });

  it("deve enviar notificação ao adicionar comentário", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Limpar notificações anteriores
    await db.delete(notifications).where(eq(notifications.userId, testUserId));
    
    // Simular comentário de outro utilizador
    const otherUserId = testUserId + 1;
    await notificationHelpers.notifyCommentAdded(testTicketId, testTicketNumber, testUserId, otherUserId);
    
    // Verificar notificação criada
    const notifs = await notificationsDb.getUserNotifications(testUserId);
    expect(notifs.length).toBeGreaterThan(0);
    
    const notification = notifs[0];
    expect(notification.type).toBe("comment_added");
    expect(notification.title).toBe("💬 Novo comentário");
    expect(notification.message).toContain(testTicketNumber);
  });

  it("não deve enviar notificação se o comentador for o próprio técnico", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Limpar notificações anteriores
    await db.delete(notifications).where(eq(notifications.userId, testUserId));
    
    // Simular comentário do próprio técnico
    await notificationHelpers.notifyCommentAdded(testTicketId, testTicketNumber, testUserId, testUserId);
    
    // Verificar que não foi criada notificação
    const notifs = await notificationsDb.getUserNotifications(testUserId);
    expect(notifs.length).toBe(0);
  });

  it("deve enviar notificação ao mudar estado do ticket", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Limpar notificações anteriores
    await db.delete(notifications).where(eq(notifications.userId, testUserId));
    
    // Simular mudança de estado por outro utilizador
    const otherUserId = testUserId + 1;
    await notificationHelpers.notifyTicketStatusChanged(testTicketId, testTicketNumber, testUserId, "em_progresso", otherUserId);
    
    // Verificar notificação criada
    const notifs = await notificationsDb.getUserNotifications(testUserId);
    expect(notifs.length).toBeGreaterThan(0);
    
    const notification = notifs[0];
    expect(notification.type).toBe("ticket_updated");
    expect(notification.title).toBe("🔄 Estado alterado");
    expect(notification.message).toContain(testTicketNumber);
    expect(notification.message).toContain("Em Progresso");
  });

  it("não deve enviar notificação se quem mudou o estado foi o próprio técnico", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Limpar notificações anteriores
    await db.delete(notifications).where(eq(notifications.userId, testUserId));
    
    // Simular mudança de estado pelo próprio técnico
    await notificationHelpers.notifyTicketStatusChanged(testTicketId, testTicketNumber, testUserId, "resolvido", testUserId);
    
    // Verificar que não foi criada notificação
    const notifs = await notificationsDb.getUserNotifications(testUserId);
    expect(notifs.length).toBe(0);
  });

  it("deve enviar notificação de alerta de SLA", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Limpar notificações anteriores
    await db.delete(notifications).where(eq(notifications.userId, testUserId));
    
    // Simular alerta de SLA
    await notificationHelpers.notifySlaWarning(testTicketId, testTicketNumber, testUserId, 5);
    
    // Verificar notificação criada
    const notifs = await notificationsDb.getUserNotifications(testUserId);
    expect(notifs.length).toBeGreaterThan(0);
    
    const notification = notifs[0];
    expect(notification.type).toBe("sla_warning");
    expect(notification.title).toBe("⚠️ Alerta de SLA");
    expect(notification.message).toContain(testTicketNumber);
    expect(notification.message).toContain("5h");
  });

  it("deve enviar notificação de violação de SLA", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Limpar notificações anteriores
    await db.delete(notifications).where(eq(notifications.userId, testUserId));
    
    // Simular violação de SLA
    await notificationHelpers.notifySlaBreached(testTicketId, testTicketNumber, testUserId);
    
    // Verificar notificação criada
    const notifs = await notificationsDb.getUserNotifications(testUserId);
    expect(notifs.length).toBeGreaterThan(0);
    
    const notification = notifs[0];
    expect(notification.type).toBe("sla_breached");
    expect(notification.title).toBe("🚨 SLA violado");
    expect(notification.message).toContain(testTicketNumber);
  });
});
