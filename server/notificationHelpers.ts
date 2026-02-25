import { createNotification } from "./notificationsDb";
import { sendTicketAssignmentEmail } from "./emailService";
import * as db from "./db";
import * as ticketsDb from "./ticketsDb";

/**
 * Envia notificação quando um ticket é atribuído a um técnico
 */
export async function notifyTicketAssigned(ticketId: number, ticketNumber: string, assignedToId: number) {
  // Criar notificação in-app
  await createNotification({
    userId: assignedToId,
    type: "ticket_assigned",
    title: "🎫 Ticket atribuído",
    message: `O ticket ${ticketNumber} foi atribuído a você`,
    ticketId,
  });

  // Enviar email de notificação
  try {
    const user = await db.getUserById(assignedToId);
    const ticket = await ticketsDb.getTicketById(ticketId);
    
    if (user && user.email && ticket) {
      await sendTicketAssignmentEmail({
        recipientEmail: user.email,
        recipientName: user.name,
        ticketNumber,
        ticketId,
        clientName: ticket.clientName || "Cliente não especificado",
        equipment: ticket.equipment || "Equipamento não especificado",
        priority: ticket.priority || "media",
        location: ticket.location || "Localização não especificada",
        description: ticket.description || "Sem descrição",
      });
    }
  } catch (error) {
    console.error("[notifyTicketAssigned] Erro ao enviar email:", error);
    // Não falhar a operação se o email falhar
  }
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

/**
 * Envia notificação para todos os utilizadores quando um anúncio urgente é publicado
 */
export async function notifyUrgentAnnouncement(
  announcementId: number,
  announcementTitle: string,
  allUserIds: number[]
) {
  // Criar notificação para cada utilizador
  for (const userId of allUserIds) {
    await createNotification({
      userId,
      type: "urgent_announcement",
      title: "📢 Anúncio Urgente",
      message: announcementTitle,
      ticketId: null,
    });
  }
}

/**
 * Envia notificação ao autor do artigo quando recebe um comentário
 */
export async function notifyArticleComment(
  articleId: number,
  articleTitle: string,
  authorId: number,
  commentAuthorId: number,
  commentAuthorName: string
) {
  // Não notificar se o autor comentou no próprio artigo
  if (authorId === commentAuthorId) return;

  await createNotification({
    userId: authorId,
    type: "article_comment",
    title: "💬 Novo comentário no seu artigo",
    message: `${commentAuthorName} comentou no artigo "${articleTitle}"`,
    ticketId: null,
  });
}

/**
 * Envia notificações aos participantes da discussão quando há um novo comentário
 */
export async function notifyArticleCommentParticipants(
  articleId: number,
  articleTitle: string,
  participantIds: number[],
  newCommentAuthorId: number,
  newCommentAuthorName: string
) {
  // Notificar cada participante (exceto o autor do novo comentário)
  for (const userId of participantIds) {
    if (userId !== newCommentAuthorId) {
      await createNotification({
        userId,
        type: "article_comment",
        title: "💬 Nova resposta na discussão",
        message: `${newCommentAuthorName} comentou no artigo "${articleTitle}"`,
        ticketId: null,
      });
    }
  }
}
