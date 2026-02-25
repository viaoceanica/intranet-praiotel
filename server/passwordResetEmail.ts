import nodemailer from "nodemailer";
import * as systemSettingsDb from "./systemSettingsDb";

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
    console.warn("[Email] SMTP não configurado");
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
 * Enviar email de recuperação de password
 */
export async function sendPasswordResetEmail(params: {
  recipientEmail: string;
  recipientName: string;
  resetToken: string;
}): Promise<boolean> {
  try {
    const transporter = await getEmailTransporter();
    if (!transporter) {
      console.warn("[Email] Transporter não disponível para recuperação de password");
      return false;
    }

    const senderConfig = await getSenderConfig();
    
    // URL de reset (usar URL de produção ou desenvolvimento)
    const baseUrl = process.env.VITE_OAUTH_PORTAL_URL || 'https://my.praiotel.pt';
    const resetUrl = `${baseUrl}/reset-password?token=${params.resetToken}`;

    // Template HTML do email
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperar Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #F15A24 0%, #D14A1E 100%); padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🔐 Recuperar Password
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
                Recebemos um pedido para recuperar a password da sua conta na Intranet Praiotel.
              </p>

              <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                Clique no botão abaixo para criar uma nova password:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; background-color: #F15A24; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Recuperar Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF3C7; border-radius: 6px; border-left: 4px solid #F59E0B; margin: 30px 0;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.5;">
                      <strong>⚠️ Importante:</strong><br>
                      Este link é válido por <strong>1 hora</strong>. Se não solicitou esta recuperação, ignore este email e a sua password permanecerá inalterada.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <a href="${resetUrl}" style="color: #F15A24; word-break: break-all;">${resetUrl}</a>
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
Recuperar Password - Intranet Praiotel

Olá ${params.recipientName},

Recebemos um pedido para recuperar a password da sua conta na Intranet Praiotel.

Clique no link abaixo para criar uma nova password:
${resetUrl}

⚠️ Importante:
Este link é válido por 1 hora. Se não solicitou esta recuperação, ignore este email e a sua password permanecerá inalterada.

---
Esta é uma notificação automática do sistema Intranet Praiotel.
    `;

    // Enviar email
    await transporter.sendMail({
      from: `"${senderConfig.fromName}" <${senderConfig.fromAddress}>`,
      to: params.recipientEmail,
      replyTo: senderConfig.replyTo,
      subject: `🔐 Recuperar Password - Intranet Praiotel`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[Email] Email de recuperação de password enviado para ${params.recipientEmail}`);
    return true;

  } catch (error) {
    console.error("[Email] Erro ao enviar email de recuperação de password:", error);
    return false;
  }
}
