import { describe, it, expect, beforeAll } from "vitest";
import * as notificationsDb from "./notificationsDb";
import { getDb } from "./db";
import { notifications, users } from "../drizzle/schema";

describe("Notifications System", () => {
  let testUserId: number;
  let testNotificationId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Limpar notificações de teste anteriores
    await db.delete(notifications);

    // Criar usuário de teste se não existir
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      testUserId = existingUsers[0].id;
    }
  });

  it("deve criar uma notificação", async () => {
    await notificationsDb.createNotification({
      userId: testUserId,
      type: "ticket_assigned",
      title: "Ticket atribuído",
      message: "Um novo ticket foi atribuído a você",
      ticketId: 1,
    });

    const userNotifications = await notificationsDb.getUserNotifications(testUserId);
    expect(userNotifications.length).toBeGreaterThan(0);
    expect(userNotifications[0].type).toBe("ticket_assigned");
    testNotificationId = userNotifications[0].id;
  });

  it("deve retornar notificações não lidas", async () => {
    const unreadNotifications = await notificationsDb.getUnreadNotifications(testUserId);
    expect(unreadNotifications.length).toBeGreaterThan(0);
    expect(unreadNotifications[0].isRead).toBe(0);
  });

  it("deve contar notificações não lidas corretamente", async () => {
    const unreadCount = await notificationsDb.getUnreadCount(testUserId);
    expect(unreadCount).toBeGreaterThan(0);
  });

  it("deve marcar notificação como lida", async () => {
    await notificationsDb.markAsRead(testNotificationId);
    
    const unreadNotifications = await notificationsDb.getUnreadNotifications(testUserId);
    const markedNotification = unreadNotifications.find(n => n.id === testNotificationId);
    expect(markedNotification).toBeUndefined();
  });

  it("deve marcar todas as notificações como lidas", async () => {
    // Criar mais notificações
    await notificationsDb.createNotification({
      userId: testUserId,
      type: "comment_added",
      title: "Novo comentário",
      message: "Um comentário foi adicionado ao ticket",
      ticketId: 1,
    });

    await notificationsDb.markAllAsRead(testUserId);
    
    const unreadCount = await notificationsDb.getUnreadCount(testUserId);
    expect(unreadCount).toBe(0);
  });

  it("deve deletar notificação", async () => {
    const userNotifications = await notificationsDb.getUserNotifications(testUserId);
    const notificationToDelete = userNotifications[0];
    
    await notificationsDb.deleteNotification(notificationToDelete.id);
    
    const updatedNotifications = await notificationsDb.getUserNotifications(testUserId);
    const deletedNotification = updatedNotifications.find(n => n.id === notificationToDelete.id);
    expect(deletedNotification).toBeUndefined();
  });
});
