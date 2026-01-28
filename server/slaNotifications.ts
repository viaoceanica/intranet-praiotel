import { getAllTickets } from "./ticketsDb";
import { getAllSlaConfigs } from "./slaDb";
import { createNotification } from "./notificationsDb";

/**
 * Verifica tickets e envia notificações de SLA
 * Esta função deve ser chamada periodicamente (ex: a cada hora)
 */
export async function checkAndNotifySla() {
  const tickets = await getAllTickets();
  const slaConfigs = await getAllSlaConfigs();
  const now = new Date();

  const notifications: Array<{
    userId: number;
    type: string;
    title: string;
    message: string;
    ticketId: number;
  }> = [];

  for (const ticket of tickets) {
    // Apenas tickets abertos ou em progresso
    if (ticket.status !== 'aberto' && ticket.status !== 'em_progresso') {
      continue;
    }

    // Apenas tickets com técnico atribuído
    if (!ticket.assignedToId) {
      continue;
    }

    const slaConfig = slaConfigs.find(c => c.priority === ticket.priority);
    if (!slaConfig) continue;

    const elapsed = now.getTime() - ticket.createdAt.getTime();
    const hoursElapsed = elapsed / (1000 * 60 * 60);
    const slaHours = slaConfig.resolutionTimeHours;
    const percentageUsed = (hoursElapsed / slaHours) * 100;

    // Notificar quando atingir 80% do tempo SLA (apenas uma vez)
    if (percentageUsed >= 80 && percentageUsed < 100) {
      const hoursRemaining = Math.max(0, Math.round(slaHours - hoursElapsed));
      
      notifications.push({
        userId: ticket.assignedToId,
        type: 'sla_warning',
        title: `⚠️ SLA Próximo do Limite - ${ticket.ticketNumber}`,
        message: `O ticket "${ticket.equipment}" está a ${percentageUsed.toFixed(0)}% do limite SLA. Restam aproximadamente ${hoursRemaining}h para resolução.`,
        ticketId: ticket.id,
      });
    }

    // Notificar quando SLA for violado (apenas uma vez)
    if (percentageUsed >= 100) {
      const hoursExceeded = Math.round(hoursElapsed - slaHours);
      
      notifications.push({
        userId: ticket.assignedToId,
        type: 'sla_breached',
        title: `🚨 SLA Violado - ${ticket.ticketNumber}`,
        message: `O ticket "${ticket.equipment}" excedeu o SLA em ${hoursExceeded}h. Resolução urgente necessária.`,
        ticketId: ticket.id,
      });
    }
  }

  // Criar notificações no sistema
  for (const notif of notifications) {
    try {
      await createNotification(notif);
    } catch (error) {
      console.error('Erro ao criar notificação SLA:', error);
    }
  }

  return {
    checked: tickets.length,
    notificationsSent: notifications.length,
  };
}

/**
 * Função auxiliar para verificar se uma notificação já foi enviada
 * (para evitar duplicação)
 */
export async function hasNotificationBeenSent(ticketId: number, type: string): Promise<boolean> {
  const { getDb } = await import('./db');
  const { notifications } = await import('../drizzle/schema');
  const { eq, and } = await import('drizzle-orm');
  
  const db = await getDb();
  if (!db) return false;

  const existing = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.ticketId, ticketId),
        eq(notifications.type, type)
      )
    )
    .limit(1);

  return existing.length > 0;
}
