import { createNotification } from "./notificationsDb";

/**
 * Envia notificação quando um ticket é atribuído a um técnico
 */
export async function notifyTicketAssigned(ticketId: number, ticketNumber: string, assignedToId: number) {
  await createNotification({
    userId: assignedToId,
    type: "ticket_assigned",
    title: "🎫 Ticket atribuído",
    message: `O ticket ${ticketNumber} foi atribuído a você`,
    ticketId,
  });
}

/**
 * Envia notificação quando um comentário é adicionado a um ticket
 */
export async function notifyCommentAdded(
  ticketId: number,
  ticketNumber: string,
  assignedToId: number | null,
  commentAuthorId: number
) {
  // Notificar o técnico atribuído (se não for ele próprio quem comentou)
  if (assignedToId && assignedToId !== commentAuthorId) {
    await createNotification({
      userId: assignedToId,
      type: "comment_added",
      title: "💬 Novo comentário",
      message: `Um comentário foi adicionado ao ticket ${ticketNumber}`,
      ticketId,
    });
  }
}

/**
 * Envia notificação quando o estado de um ticket é alterado
 */
export async function notifyTicketStatusChanged(
  ticketId: number,
  ticketNumber: string,
  assignedToId: number | null,
  newStatus: string,
  changedById: number
) {
  const statusLabels: Record<string, string> = {
    aberto: "Aberto",
    em_progresso: "Em Progresso",
    resolvido: "Resolvido",
    fechado: "Fechado",
  };

  // Notificar o técnico atribuído (se não for ele próprio quem alterou)
  if (assignedToId && assignedToId !== changedById) {
    await createNotification({
      userId: assignedToId,
      type: "ticket_updated",
      title: "🔄 Estado alterado",
      message: `O ticket ${ticketNumber} foi alterado para "${statusLabels[newStatus] || newStatus}"`,
      ticketId,
    });
  }
}

/**
 * Envia notificação quando um ticket está próximo de violar o SLA
 */
export async function notifySlaWarning(
  ticketId: number,
  ticketNumber: string,
  assignedToId: number | null,
  hoursRemaining: number
) {
  if (assignedToId) {
    await createNotification({
      userId: assignedToId,
      type: "sla_warning",
      title: "⚠️ Alerta de SLA",
      message: `O ticket ${ticketNumber} tem apenas ${hoursRemaining}h restantes de SLA`,
      ticketId,
    });
  }
}

/**
 * Envia notificação quando um ticket viola o SLA
 */
export async function notifySlaBreached(
  ticketId: number,
  ticketNumber: string,
  assignedToId: number | null
) {
  if (assignedToId) {
    await createNotification({
      userId: assignedToId,
      type: "sla_breached",
      title: "🚨 SLA violado",
      message: `O ticket ${ticketNumber} ultrapassou o prazo de SLA`,
      ticketId,
    });
  }
}
