import { getDb } from "./db";
import { systemSettings } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Obter todas as configurações
 */
export async function getAllSettings() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db.select().from(systemSettings).orderBy(systemSettings.category, systemSettings.settingKey);
}

/**
 * Obter configurações por categoria
 */
export async function getSettingsByCategory(category: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db.select().from(systemSettings).where(eq(systemSettings.category, category));
}

/**
 * Obter uma configuração específica por chave
 */
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const results = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key));
  return results[0] || null;
}

/**
 * Obter o valor de uma configuração (com valor padrão)
 */
export async function getSettingValue(key: string, defaultValue: string = ""): Promise<string> {
  const setting = await getSetting(key);
  return setting?.settingValue || defaultValue;
}

/**
 * Criar ou atualizar uma configuração (upsert)
 */
export async function upsertSetting(data: {
  key: string;
  value: string | null;
  type?: string;
  category?: string;
  label?: string;
  description?: string;
  updatedById?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const existing = await getSetting(data.key);

  if (existing) {
    await db.update(systemSettings)
      .set({
        settingValue: data.value,
        ...(data.type && { settingType: data.type }),
        ...(data.label && { label: data.label }),
        ...(data.description && { description: data.description }),
        ...(data.updatedById && { updatedById: data.updatedById }),
      })
      .where(eq(systemSettings.settingKey, data.key));
  } else {
    await db.insert(systemSettings).values({
      settingKey: data.key,
      settingValue: data.value,
      settingType: data.type || "string",
      category: data.category || "general",
      label: data.label || data.key,
      description: data.description || null,
      updatedById: data.updatedById || null,
    });
  }

  return { success: true };
}

/**
 * Atualizar múltiplas configurações de uma vez
 */
export async function updateMultipleSettings(
  settings: Array<{ key: string; value: string | null }>,
  updatedById: number
) {
  for (const setting of settings) {
    await upsertSetting({
      key: setting.key,
      value: setting.value,
      updatedById,
    });
  }
  return { success: true };
}

/**
 * Inicializar configurações padrão (se não existirem)
 */
export async function initializeDefaultSettings() {
  const defaults = [
    // Geral
    { key: "company_name", value: "Praiotel", type: "string", category: "general", label: "Nome da Empresa", description: "Nome da empresa exibido no sistema" },
    { key: "company_nif", value: "", type: "string", category: "general", label: "NIF da Empresa", description: "Número de Identificação Fiscal" },
    { key: "company_address", value: "", type: "string", category: "general", label: "Morada", description: "Morada da sede da empresa" },
    { key: "company_phone", value: "", type: "string", category: "general", label: "Telefone", description: "Telefone principal da empresa" },
    { key: "company_website", value: "", type: "string", category: "general", label: "Website", description: "URL do website da empresa" },
    { key: "timezone", value: "Atlantic/Azores", type: "string", category: "general", label: "Fuso Horário", description: "Fuso horário padrão do sistema" },
    { key: "language", value: "pt-PT", type: "string", category: "general", label: "Idioma", description: "Idioma padrão do sistema" },
    { key: "date_format", value: "DD/MM/YYYY", type: "string", category: "general", label: "Formato de Data", description: "Formato de exibição de datas" },
    { key: "currency", value: "EUR", type: "string", category: "general", label: "Moeda", description: "Moeda padrão para valores monetários" },
    
    // Email / SMTP
    { key: "smtp_host", value: "", type: "string", category: "email", label: "Servidor SMTP", description: "Endereço do servidor de email (ex: smtp.gmail.com)" },
    { key: "smtp_port", value: "587", type: "number", category: "email", label: "Porta SMTP", description: "Porta do servidor SMTP (587 para TLS, 465 para SSL)" },
    { key: "smtp_user", value: "", type: "string", category: "email", label: "Utilizador SMTP", description: "Email ou utilizador para autenticação SMTP" },
    { key: "smtp_password", value: "", type: "string", category: "email", label: "Password SMTP", description: "Password para autenticação SMTP" },
    { key: "smtp_secure", value: "true", type: "boolean", category: "email", label: "Usar TLS/SSL", description: "Ativar encriptação na ligação SMTP" },
    { key: "email_from_name", value: "Intranet Praiotel", type: "string", category: "email", label: "Nome do Remetente", description: "Nome exibido como remetente dos emails" },
    { key: "email_from_address", value: "", type: "string", category: "email", label: "Email do Remetente", description: "Endereço de email usado como remetente" },
    { key: "email_reply_to", value: "", type: "string", category: "email", label: "Email de Resposta", description: "Endereço para onde as respostas são enviadas" },
    { key: "email_password_recovery", value: "true", type: "boolean", category: "email", label: "Recuperação de Password por Email", description: "Permitir que os utilizadores recuperem a password por email" },
    { key: "email_ticket_notifications", value: "true", type: "boolean", category: "email", label: "Notificações de Tickets por Email", description: "Enviar notificações por email quando tickets são criados ou atualizados" },
    { key: "email_sla_alerts", value: "true", type: "boolean", category: "email", label: "Alertas de SLA por Email", description: "Enviar alertas por email quando SLA está prestes a ser violado" },
    
    // Segurança
    { key: "session_timeout", value: "480", type: "number", category: "security", label: "Timeout de Sessão (minutos)", description: "Tempo máximo de inatividade antes de terminar a sessão" },
    { key: "max_login_attempts", value: "5", type: "number", category: "security", label: "Tentativas de Login Máximas", description: "Número máximo de tentativas de login falhadas antes de bloquear" },
    { key: "lockout_duration", value: "15", type: "number", category: "security", label: "Duração do Bloqueio (minutos)", description: "Tempo de bloqueio após exceder tentativas de login" },
    { key: "password_min_length", value: "8", type: "number", category: "security", label: "Comprimento Mínimo da Password", description: "Número mínimo de caracteres para passwords" },
    { key: "password_require_uppercase", value: "true", type: "boolean", category: "security", label: "Exigir Maiúsculas", description: "Exigir pelo menos uma letra maiúscula na password" },
    { key: "password_require_numbers", value: "true", type: "boolean", category: "security", label: "Exigir Números", description: "Exigir pelo menos um número na password" },
  ];

  for (const setting of defaults) {
    const existing = await getSetting(setting.key);
    if (!existing) {
      await upsertSetting(setting);
    }
  }
}
