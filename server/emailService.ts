import nodemailer from "nodemailer";
import * as systemSettingsDb from "./systemSettingsDb";
import { getDb } from "./db";
import { emailLogs } from "../drizzle/schema";

/**
 * Configurar transporter do nodemailer com as definições do sistema
 */
async function getEmailTransporter() {
  const settings = await systemSettingsDb.getAllSettings();
  const settingsMap = new Map(settings.map(s => [s.settingKey, s.settingValue]));

  const smtpHost = settingsMap.get("smtp_host");
  const smtpPort = parseInt(settingsMap.get("smtp_port") || "587");
  const smtpUser = settingsMap.get("smtp_user");
  const smtpPassword = settingsMap.get("smtp_password");
  const smtpSecure = settingsMap.get("smtp_secure") === "true";

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.warn("[Email] SMTP não configurado. Configure em Configurações > Sistema > Email");
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
}

/**
 * Obter configurações de remetente
 */
async function getSenderConfig() {
  const settings = await systemSettingsDb.getAllSettings();
  const settingsMap = new Map(settings.map(s => [s.settingKey, s.settingValue]));

  return {
    fromName: settingsMap.get("email_from_name") || "Intranet Praiotel",
    fromAddress: settingsMap.get("email_from_address") || settingsMap.get("smtp_user") || "",
    replyTo: settingsMap.get("email_reply_to") || settingsMap.get("email_from_address") || "",
  };
}

/**
 * Verificar se notificações de tickets por email estão ativadas
 */
async function areTicketNotificationsEnabled(): Promise<boolean> {
  const settings = await systemSettingsDb.getAllSettings();
  const setting = settings.find(s => s.settingKey === "email_ticket_notifications");
  return setting?.settingValue === "true";
}

/**
 * Enviar email de notificação de atribuição de ticket
 */
export async function sendTicketAssignmentEmail(params: {
  recipientEmail: string;
  recipientName: string;
  ticketNumber: string;
  ticketId: number;
  clientName: string;
  equipment: string;
  priority: string;
  location: string;
  description: string;
}): Promise<boolean> {
  try {
    // Verificar se notificações estão ativadas
    const enabled = await areTicketNotificationsEnabled();
    if (!enabled) {
      console.log("[Email] Notificações de tickets por email desativadas");
      return false;
    }

    const transporter = await getEmailTransporter();
    if (!transporter) {
      console.warn("[Email] Transporter não disponível");
      return false;
    }

    const senderConfig = await getSenderConfig();
    
    // Mapear prioridade para cor e emoji
    const priorityConfig: Record<string, { color: string; emoji: string; label: string }> = {
      baixa: { color: "#10B981", emoji: "🟢", label: "Baixa" },
      media: { color: "#F59E0B", emoji: "🟡", label: "Média" },
      alta: { color: "#EF4444", emoji: "🔴", label: "Alta" },
      urgente: { color: "#DC2626", emoji: "🚨", label: "Urgente" },
    };

    const priorityInfo = priorityConfig[params.priority] || priorityConfig.media;

    // Template HTML do email
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Ticket Atribuído</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #F15A24 0%, #D14A1E 100%); padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🎫 Novo Ticket Atribuído
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                Olá <strong>${params.recipientName}</strong>,
              </p>
              
              <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                Foi-lhe atribuído um novo ticket de assistência técnica. Por favor, verifique os detalhes abaixo:
              </p>

              <!-- Ticket Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <!-- Ticket Number -->
                    <div style="margin-bottom: 15px;">
                      <span style="display: inline-block; background-color: #F15A24; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 600;">
                        ${params.ticketNumber}
                      </span>
                    </div>

                    <!-- Priority -->
                    <div style="margin-bottom: 20px;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-right: 10px;">
                            <span style="font-size: 24px;">${priorityInfo.emoji}</span>
                          </td>
                          <td>
                            <span style="color: #6b7280; font-size: 14px;">Prioridade:</span><br>
                            <span style="color: ${priorityInfo.color}; font-weight: 600; font-size: 16px;">${priorityInfo.label}</span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Details -->
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 120px; vertical-align: top;">Cliente:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 500;">${params.clientName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; vertical-align: top;">Equipamento:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 500;">${params.equipment}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; vertical-align: top;">Localização:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 500;">${params.location}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; vertical-align: top;">Descrição:</td>
                        <td style="color: #111827; font-size: 14px;">${params.description}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${process.env.VITE_OAUTH_PORTAL_URL || 'https://my.praiotel.pt'}/tickets/${params.ticketId}" 
                       style="display: inline-block; background-color: #F15A24; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Ver Ticket Completo
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Por favor, aceda à plataforma para mais detalhes e para atualizar o estado do ticket.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                Esta é uma notificação automática do sistema Intranet Praiotel.<br>
                Por favor, não responda a este email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Versão texto simples (fallback)
    const textContent = `
Novo Ticket Atribuído

Olá ${params.recipientName},

Foi-lhe atribuído um novo ticket de assistência técnica:

Ticket: ${params.ticketNumber}
Prioridade: ${priorityInfo.label}
Cliente: ${params.clientName}
Equipamento: ${params.equipment}
Localização: ${params.location}
Descrição: ${params.description}

Aceda à plataforma para ver mais detalhes:
${process.env.VITE_OAUTH_PORTAL_URL || 'https://my.praiotel.pt'}/tickets/${params.ticketId}

---
Esta é uma notificação automática do sistema Intranet Praiotel.
    `;

    // Enviar email
    await transporter.sendMail({
      from: `"${senderConfig.fromName}" <${senderConfig.fromAddress}>`,
      to: params.recipientEmail,
      replyTo: senderConfig.replyTo,
      subject: `🎫 Novo Ticket: ${params.ticketNumber} - ${params.clientName}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[Email] Notificação enviada para ${params.recipientEmail} (Ticket ${params.ticketNumber})`);
    
    // Registar log de sucesso
    const db = await getDb();
    if (db) {
      await db.insert(emailLogs).values({
      type: "ticket_assignment",
      recipient: params.recipientEmail,
      subject: `🎫 Novo Ticket: ${params.ticketNumber} - ${params.clientName}`,
      status: "sent",
      errorMessage: null,
      metadata: JSON.stringify({
        ticketId: params.ticketId,
        ticketNumber: params.ticketNumber,
        recipientName: params.recipientName,
      }),
      });
    }
    
    return true;

  } catch (error) {
    console.error("[Email] Erro ao enviar notificação de atribuição:", error);
    
    // Registar log de falha
    try {
      const db = await getDb();
      if (db) {
        await db.insert(emailLogs).values({
        type: "ticket_assignment",
        recipient: params.recipientEmail,
        subject: `🎫 Novo Ticket: ${params.ticketNumber} - ${params.clientName}`,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
        metadata: JSON.stringify({
          ticketId: params.ticketId,
          ticketNumber: params.ticketNumber,
          recipientName: params.recipientName,
        }),
        });
      }
    } catch (logError) {
      console.error("[Email] Erro ao registar log de falha:", logError);
    }
    
    return false;
  }
}
