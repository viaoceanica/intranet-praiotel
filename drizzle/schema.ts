import { date, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Preferências de ordem dos menus por utilizador
 */
export const userMenuOrder = mysqlTable("user_menu_order", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  menuOrder: text("menuOrder").notNull(), // JSON array of menu item names in order
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Utilizadores do sistema com autenticação autónoma
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: text("name").notNull(),
  role: varchar("role", { length: 100 }).default("visualizador").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tokens de recuperação de password
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: int("used").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

/**
 * Tickets de assistência técnica
 */
export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketNumber: varchar("ticketNumber", { length: 20 }).notNull().unique(),
  clientId: int("clientId"),
  commercialClientId: int("commercialClientId"),
  clientType: mysqlEnum("clientType", ["assistencia", "comercial"]).default("assistencia").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  equipmentId: int("equipmentId"),
  equipment: varchar("equipment", { length: 255 }).notNull(),
  problemType: varchar("problemType", { length: 255 }).notNull(),
  priority: varchar("priority", { length: 50 }).default("media").notNull(), // Alterado para varchar
  status: mysqlEnum("status", ["aberto", "em_progresso", "resolvido", "fechado"]).default("aberto").notNull(),
  assignedToId: int("assignedToId"),
  location: varchar("location", { length: 100 }).notNull(),
  description: text("description").notNull(),
  notes: text("notes"),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
  closedAt: timestamp("closedAt"),
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

/**
 * Anexos dos tickets (fotos, documentos)
 */
export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  uploadedById: int("uploadedById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

/**
 * Histórico de alterações nos tickets
 */
export const ticketHistory = mysqlTable("ticketHistory", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  fieldChanged: varchar("fieldChanged", { length: 100 }),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TicketHistory = typeof ticketHistory.$inferSelect;
export type InsertTicketHistory = typeof ticketHistory.$inferInsert;

/**
 * Notificações do sistema
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // ticket_assigned, ticket_updated, note_added
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  ticketId: int("ticketId"),
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Clientes
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  designation: varchar("designation", { length: 255 }).notNull(),
  address: text("address"),
  primaryEmail: varchar("primaryEmail", { length: 320 }).notNull(),
  nif: varchar("nif", { length: 20 }).notNull().unique(),
  responsiblePerson: varchar("responsiblePerson", { length: 255 }),
  
  // Campos CRM
  source: mysqlEnum("source", ["lead", "direto", "outro"]).default("direto"),
  leadId: int("leadId"), // Referência ao lead original (se convertido)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Emails adicionais dos clientes
 */
export const clientEmails = mysqlTable("clientEmails", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientEmail = typeof clientEmails.$inferSelect;
export type InsertClientEmail = typeof clientEmails.$inferInsert;

/**
 * Configuração de SLA (Service Level Agreement) por prioridade
 */
export const slaConfig = mysqlTable("slaConfig", {
  id: int("id").autoincrement().primaryKey(),
  priority: varchar("priority", { length: 50 }).notNull().unique(), // Alterado para varchar para suportar prioridades personalizadas
  displayName: varchar("displayName", { length: 100 }).notNull(), // Nome de exibição
  isCustom: int("isCustom").default(0).notNull(), // 0 = prioridade base, 1 = personalizada
  responseTimeHours: int("responseTimeHours").notNull(), // Tempo de resposta em horas
  resolutionTimeHours: int("resolutionTimeHours").notNull(), // Tempo de resolução em horas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SlaConfig = typeof slaConfig.$inferSelect;
export type InsertSlaConfig = typeof slaConfig.$inferInsert;

/**
 * Equipamentos
 */
export const equipment = mysqlTable("equipment", {
  id: int("id").autoincrement().primaryKey(),
  serialNumber: varchar("serialNumber", { length: 100 }).notNull().unique(),
  brand: varchar("brand", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }),
  location: varchar("location", { length: 100 }),
  clientId: int("clientId"),
  isCritical: int("isCritical").default(0).notNull(), // 1 = crítico, 0 = normal
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = typeof equipment.$inferInsert;

/**
 * Regras de priorização automática
 */
export const prioritizationRules = mysqlTable("prioritizationRules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  ruleType: mysqlEnum("ruleType", ["vip_client", "critical_equipment", "keyword", "time_elapsed"]).notNull(),
  condition: text("condition").notNull(), // JSON com condições específicas
  targetPriority: mysqlEnum("targetPriority", ["baixa", "media", "alta", "urgente"]).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PrioritizationRule = typeof prioritizationRules.$inferSelect;
export type InsertPrioritizationRule = typeof prioritizationRules.$inferInsert;

/**
 * Histórico de alterações de prioridade
 */
export const priorityChangeLog = mysqlTable("priorityChangeLog", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  oldPriority: mysqlEnum("oldPriority", ["baixa", "media", "alta", "urgente"]).notNull(),
  newPriority: mysqlEnum("newPriority", ["baixa", "media", "alta", "urgente"]).notNull(),
  changedBy: varchar("changedBy", { length: 50 }).notNull(), // "user" ou "auto"
  reason: text("reason"),
  ruleId: int("ruleId"), // Se foi automático, qual regra aplicou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PriorityChangeLog = typeof priorityChangeLog.$inferSelect;
export type InsertPriorityChangeLog = typeof priorityChangeLog.$inferInsert;

/**
 * Templates de resposta para comentários
 */
export const responseTemplates = mysqlTable("response_templates", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResponseTemplate = typeof responseTemplates.$inferSelect;
export type InsertResponseTemplate = typeof responseTemplates.$inferInsert;

/**
 * Roles personalizados do sistema
 */
export const customRoles = mysqlTable("custom_roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isSystem: int("is_system").default(0).notNull(), // 1 para roles padrão (não podem ser eliminados)
  permissions: text("permissions").notNull(), // JSON com array de permissões
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomRole = typeof customRoles.$inferSelect;
export type InsertCustomRole = typeof customRoles.$inferInsert;

/**
 * Notícias internas para o Painel Inicial
 */
export const internalNews = mysqlTable("internal_news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: int("authorId").notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InternalNews = typeof internalNews.$inferSelect;
export type InsertInternalNews = typeof internalNews.$inferInsert;

/**
 * Acessos rápidos para o Painel Inicial
 */
export const quickAccess = mysqlTable("quick_access", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(), // Nome do ícone lucide-react
  displayOrder: int("displayOrder").default(0).notNull(),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuickAccess = typeof quickAccess.$inferSelect;
export type InsertQuickAccess = typeof quickAccess.$inferInsert;

/**
 * Anúncios gerais da Área de Comunicação
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  priority: mysqlEnum("priority", ["baixa", "normal", "alta", "urgente"]).default("normal").notNull(),
  authorId: int("authorId").notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Mensagens do mural (Área de Comunicação)
 */
export const bulletinMessages = mysqlTable("bulletin_messages", {
  id: int("id").autoincrement().primaryKey(),
  message: text("message").notNull(),
  authorId: int("authorId").notNull(),
  likesCount: int("likesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BulletinMessage = typeof bulletinMessages.$inferSelect;
export type InsertBulletinMessage = typeof bulletinMessages.$inferInsert;

/**
 * Likes nas mensagens do mural
 */
export const bulletinLikes = mysqlTable("bulletin_likes", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BulletinLike = typeof bulletinLikes.$inferSelect;
export type InsertBulletinLike = typeof bulletinLikes.$inferInsert;

/**
 * Categorias de documentos
 */
export const documentCategories = mysqlTable("document_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).notNull(), // Nome do ícone lucide-react
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentCategory = typeof documentCategories.$inferSelect;
export type InsertDocumentCategory = typeof documentCategories.$inferInsert;

/**
 * Documentos da Gestão de Documentos
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  categoryId: int("categoryId").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  fileSize: int("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  uploadedById: int("uploadedById").notNull(),
  downloadCount: int("downloadCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Categorias de conhecimento (Tutoriais, Formação, FAQ)
 */
export const knowledgeCategories = mysqlTable("knowledge_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).notNull(), // Nome do ícone lucide-react
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KnowledgeCategory = typeof knowledgeCategories.$inferSelect;
export type InsertKnowledgeCategory = typeof knowledgeCategories.$inferInsert;

/**
 * Artigos da Base de Conhecimento
 */
export const knowledgeArticles = mysqlTable("knowledge_articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  categoryId: int("categoryId").notNull(),
  tags: text("tags"), // JSON array de tags
  authorId: int("authorId").notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = typeof knowledgeArticles.$inferInsert;

/**
 * Favoritos dos utilizadores (artigos e documentos)
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemType: mysqlEnum("itemType", ["article", "document"]).notNull(),
  itemId: int("itemId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Comentários em artigos de conhecimento
 */
export const articleComments = mysqlTable("article_comments", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  userId: int("userId").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ArticleComment = typeof articleComments.$inferSelect;
export type InsertArticleComment = typeof articleComments.$inferInsert;

/**
 * Registo de leituras de artigos de conhecimento
 */
export const articleReads = mysqlTable("article_reads", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  userId: int("userId").notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
});

export type ArticleRead = typeof articleReads.$inferSelect;
export type InsertArticleRead = typeof articleReads.$inferInsert;

/**
 * Tags para classificação de artigos
 */
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  color: varchar("color", { length: 7 }).notNull().default("#3b82f6"), // Cor em hexadecimal
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Relacionamento entre artigos e tags (muitos para muitos)
 */
export const articleTags = mysqlTable("article_tags", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  tagId: int("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArticleTag = typeof articleTags.$inferSelect;
export type InsertArticleTag = typeof articleTags.$inferInsert;

// ============================================================================
// MÓDULO CRM - Customer Relationship Management
// ============================================================================

/**
 * Leads do CRM - Potenciais clientes
 * Extensão da tabela clients para incluir leads que ainda não são clientes
 */
export const crmLeads = mysqlTable("crm_leads", {
  id: int("id").autoincrement().primaryKey(),
  // Informação básica
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  jobTitle: varchar("jobTitle", { length: 100 }),
  
  // Origem e classificação
  source: varchar("source", { length: 100 }).notNull(), // formulário, evento, anúncio, referência, importação
  status: mysqlEnum("status", ["novo", "contactado", "qualificado", "nao_qualificado", "convertido"]).default("novo").notNull(),
  score: int("score").default(0).notNull(), // Lead scoring 0-100
  
  // Qualificação
  budget: decimal("budget", { precision: 10, scale: 2 }),
  timeline: varchar("timeline", { length: 100 }), // Prazo para decisão
  needs: text("needs"), // Necessidades identificadas
  
  // Atribuição
  assignedToId: int("assignedToId"), // Vendedor responsável
  
  // Conversão
  convertedToClientId: int("convertedToClientId"), // Referência ao cliente criado
  convertedToOpportunityId: int("convertedToOpportunityId"), // Referência à oportunidade criada
  convertedAt: timestamp("convertedAt"),
  
  // Notas e observações
  notes: text("notes"),
  
  // Timestamps
  lastContactedAt: timestamp("lastContactedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = typeof crmLeads.$inferInsert;

/**
 * Oportunidades de venda no CRM
 */
export const crmOpportunities = mysqlTable("crm_opportunities", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informação básica
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Relacionamentos
  leadId: int("leadId"), // Lead de origem (se aplicável)
  clientId: int("clientId"), // Cliente associado (se já for cliente)
  
  // Valores e probabilidade
  value: decimal("value", { precision: 10, scale: 2 }).notNull(), // Valor estimado
  probability: int("probability").default(50).notNull(), // Probabilidade de fecho (0-100%)
  
  // Pipeline
  stage: mysqlEnum("stage", ["prospeccao", "qualificacao", "proposta", "negociacao", "fechamento"]).default("prospeccao").notNull(),
  status: mysqlEnum("status", ["aberta", "ganha", "perdida", "cancelada"]).default("aberta").notNull(),
  
  // Atribuição
  assignedToId: int("assignedToId").notNull(), // Vendedor responsável
  
  // Datas importantes
  expectedCloseDate: date("expectedCloseDate"), // Data prevista de fecho
  actualCloseDate: date("actualCloseDate"), // Data real de fecho
  
  // Motivo (se perdida ou cancelada)
  lostReason: text("lostReason"),
  
  // Notas
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmOpportunity = typeof crmOpportunities.$inferSelect;
export type InsertCrmOpportunity = typeof crmOpportunities.$inferInsert;

/**
 * Atividades/Interações do CRM
 * Registo de todas as interações com leads/oportunidades/clientes
 */
export const crmActivities = mysqlTable("crm_activities", {
  id: int("id").autoincrement().primaryKey(),
  
  // Tipo de atividade
  type: mysqlEnum("type", ["chamada", "email", "reuniao", "nota", "tarefa_concluida"]).notNull(),
  
  // Relacionamentos (pelo menos um deve estar preenchido)
  leadId: int("leadId"),
  opportunityId: int("opportunityId"),
  clientId: int("clientId"),
  
  // Conteúdo
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  
  // Resultado (para chamadas e reuniões)
  outcome: varchar("outcome", { length: 100 }), // sucesso, sem_resposta, reagendar, etc.
  
  // Duração (para chamadas e reuniões, em minutos)
  duration: int("duration"),
  
  // Utilizador que registou
  userId: int("userId").notNull(),
  
  // Timestamps
  activityDate: timestamp("activityDate").defaultNow().notNull(), // Data/hora da atividade
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrmActivity = typeof crmActivities.$inferSelect;
export type InsertCrmActivity = typeof crmActivities.$inferInsert;

/**
 * Tarefas do CRM
 * Tarefas agendadas relacionadas com leads/oportunidades
 */
export const crmTasks = mysqlTable("crm_tasks", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informação da tarefa
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["chamada", "email", "reuniao", "follow_up", "outro"]).notNull(),
  
  // Relacionamentos
  leadId: int("leadId"),
  opportunityId: int("opportunityId"),
  clientId: int("clientId"),
  
  // Atribuição
  assignedToId: int("assignedToId").notNull(),
  
  // Estado e prioridade
  status: mysqlEnum("status", ["pendente", "em_progresso", "concluida", "cancelada"]).default("pendente").notNull(),
  priority: mysqlEnum("priority", ["baixa", "media", "alta", "urgente"]).default("media").notNull(),
  
  // Datas
  dueDate: timestamp("dueDate").notNull(), // Data/hora de vencimento
  completedAt: timestamp("completedAt"),
  
  // Lembrete
  reminderMinutes: int("reminderMinutes").default(30), // Minutos antes para lembrete
  reminderSent: int("reminderSent").default(0).notNull(), // 0 = não enviado, 1 = enviado
  
  // Recorrência
  isRecurring: int("isRecurring").default(0).notNull(), // 0 = não recorrente, 1 = recorrente
  recurrencePattern: mysqlEnum("recurrencePattern", ["diaria", "semanal", "mensal"]), // Padrão de recorrência
  recurrenceInterval: int("recurrenceInterval").default(1), // Intervalo (ex: a cada 2 semanas)
  parentTaskId: int("parentTaskId"), // ID da tarefa pai (para tarefas geradas automaticamente)
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmTask = typeof crmTasks.$inferSelect;
export type InsertCrmTask = typeof crmTasks.$inferInsert;

/**
 * Campanhas de Marketing
 */
export const crmCampaigns = mysqlTable("crm_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informação da campanha
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["email", "newsletter", "evento", "webinar", "outro"]).notNull(),
  
  // Estado
  status: mysqlEnum("status", ["rascunho", "agendada", "em_envio", "enviada", "cancelada"]).default("rascunho").notNull(),
  
  // Conteúdo (para campanhas de email)
  subject: varchar("subject", { length: 255 }),
  emailContent: text("emailContent"), // HTML do email
  templateId: int("templateId"), // Referência ao template de email
  
  // Agendamento
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  
  // Métricas
  totalRecipients: int("totalRecipients").default(0).notNull(),
  sentCount: int("sentCount").default(0).notNull(),
  openedCount: int("openedCount").default(0).notNull(),
  clickedCount: int("clickedCount").default(0).notNull(),
  bouncedCount: int("bouncedCount").default(0).notNull(),
  
  // Criador
  createdById: int("createdById").notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmCampaign = typeof crmCampaigns.$inferSelect;
export type InsertCrmCampaign = typeof crmCampaigns.$inferInsert;

/**
 * Contactos incluídos em campanhas
 * Relacionamento muitos-para-muitos entre campanhas e leads/clientes
 */
export const crmCampaignContacts = mysqlTable("crm_campaign_contacts", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamentos
  campaignId: int("campaignId").notNull(),
  leadId: int("leadId"),
  clientId: int("clientId"),
  
  // Estado do envio
  status: mysqlEnum("status", ["pendente", "enviado", "aberto", "clicado", "bounce", "erro"]).default("pendente").notNull(),
  
  // Métricas individuais
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  bouncedAt: timestamp("bouncedAt"),
  
  // Erro (se aplicável)
  errorMessage: text("errorMessage"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrmCampaignContact = typeof crmCampaignContacts.$inferSelect;
export type InsertCrmCampaignContact = typeof crmCampaignContacts.$inferInsert;

/**
 * Documentos do CRM
 * Propostas, contratos, apresentações associadas a oportunidades
 */
export const crmDocuments = mysqlTable("crm_documents", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informação do documento
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["proposta", "contrato", "apresentacao", "outro"]).notNull(),
  
  // Relacionamentos
  leadId: int("leadId"),
  opportunityId: int("opportunityId"),
  clientId: int("clientId"),
  
  // Ficheiro
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  fileSize: int("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  
  // Versão (para controlo de versões)
  version: int("version").default(1).notNull(),
  previousVersionId: int("previousVersionId"), // Referência à versão anterior
  
  // Upload
  uploadedById: int("uploadedById").notNull(),
  
  // Notas
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmDocument = typeof crmDocuments.$inferSelect;
export type InsertCrmDocument = typeof crmDocuments.$inferInsert;

/**
 * Configurações do CRM
 * Armazena configurações como SMTP, lead scoring, etc.
 */
export const crmSettings = mysqlTable("crm_settings", {
  id: int("id").autoincrement().primaryKey(),
  
  // Chave única para cada configuração
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  
  // Valor (JSON para configurações complexas)
  settingValue: text("settingValue").notNull(),
  
  // Descrição
  description: text("description"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmSetting = typeof crmSettings.$inferSelect;
export type InsertCrmSetting = typeof crmSettings.$inferInsert;

/**
 * Histórico de alterações de fases de oportunidades
 * Para tracking do pipeline
 */
export const crmOpportunityHistory = mysqlTable("crm_opportunity_history", {
  id: int("id").autoincrement().primaryKey(),
  
  // Oportunidade
  opportunityId: int("opportunityId").notNull(),
  
  // Alteração
  fromStage: mysqlEnum("fromStage", ["prospeccao", "qualificacao", "proposta", "negociacao", "fechamento"]),
  toStage: mysqlEnum("toStage", ["prospeccao", "qualificacao", "proposta", "negociacao", "fechamento"]).notNull(),
  
  // Utilizador que fez a alteração
  changedById: int("changedById").notNull(),
  
  // Notas sobre a alteração
  notes: text("notes"),
  
  // Timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrmOpportunityHistory = typeof crmOpportunityHistory.$inferSelect;
export type InsertCrmOpportunityHistory = typeof crmOpportunityHistory.$inferInsert;

// ============================================================================
// TEMPLATES DE EMAIL PARA CAMPANHAS
// ============================================================================

/**
 * Templates de email para campanhas CRM
 * Suportam variáveis dinâmicas como {{nome}}, {{empresa}}, {{email}}
 */
export const crmEmailTemplates = mysqlTable("crm_email_templates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informação do template
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).default("geral").notNull(),
  
  // Conteúdo
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("htmlContent").notNull(),
  
  // Variáveis disponíveis (JSON array de strings)
  variables: text("variables"),
  
  // Estado
  isDefault: int("isDefault").default(0).notNull(),
  active: int("active").default(1).notNull(),
  
  // Criador
  createdById: int("createdById").notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmEmailTemplate = typeof crmEmailTemplates.$inferSelect;
export type InsertCrmEmailTemplate = typeof crmEmailTemplates.$inferInsert;

// ============================================================================
// AUTOMAÇÃO DE WORKFLOWS CRM
// ============================================================================

/**
 * Regras de automação de workflows CRM
 * Definem triggers, condições e ações automáticas
 */
export const crmWorkflowRules = mysqlTable("crm_workflow_rules", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informação da regra
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Trigger (o que dispara a regra)
  triggerType: varchar("triggerType", { length: 100 }).notNull(),
  // Valores: opportunity_stage_change, new_lead, lead_status_change, task_completed, lead_score_change
  
  // Condição (JSON com condições específicas)
  conditions: text("conditions").notNull(),
  // Ex: {"fromStage": "qualificacao", "toStage": "proposta"}
  
  // Ação (o que acontece quando a regra é ativada)
  actionType: varchar("actionType", { length: 100 }).notNull(),
  // Valores: create_task, send_notification, change_status, assign_user, update_score
  
  // Parâmetros da ação (JSON)
  actionParams: text("actionParams").notNull(),
  // Ex: {"taskTitle": "Follow-up proposta", "taskType": "follow_up", "dueDays": 3}
  
  // Estado
  active: int("active").default(1).notNull(),
  
  // Prioridade (ordem de execução)
  priority: int("priority").default(0).notNull(),
  
  // Estatísticas
  executionCount: int("executionCount").default(0).notNull(),
  lastExecutedAt: timestamp("lastExecutedAt"),
  
  // Criador
  createdById: int("createdById").notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmWorkflowRule = typeof crmWorkflowRules.$inferSelect;
export type InsertCrmWorkflowRule = typeof crmWorkflowRules.$inferInsert;

/**
 * Log de execução de workflows
 */
export const crmWorkflowLogs = mysqlTable("crm_workflow_logs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Regra executada
  ruleId: int("ruleId").notNull(),
  
  // Contexto (JSON com dados do trigger)
  triggerData: text("triggerData").notNull(),
  
  // Resultado
  success: int("success").default(1).notNull(),
  resultMessage: text("resultMessage"),
  
  // Timestamp
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export type CrmWorkflowLog = typeof crmWorkflowLogs.$inferSelect;
export type InsertCrmWorkflowLog = typeof crmWorkflowLogs.$inferInsert;

/**
 * Configurações gerais do sistema
 */
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  settingValue: text("setting_value"),
  settingType: varchar("setting_type", { length: 20 }).default("string").notNull(), // string, number, boolean, json
  category: varchar("category", { length: 50 }).default("general").notNull(), // general, email, security, appearance
  label: varchar("label", { length: 200 }),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedById: int("updated_by_id"),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;


/**
 * Clientes Gestão Comercial (importados do ERP/Excel)
 * Separados dos clientes de assistência técnica (tabela clients)
 */
export const commercialClients = mysqlTable("commercial_clients", {
  id: int("id").autoincrement().primaryKey(),
  externalId: int("external_id"), // N_ do ERP
  company: varchar("company", { length: 500 }).notNull(),
  address: text("address"),
  locality: varchar("locality", { length: 255 }),
  postalCode: varchar("postal_code", { length: 50 }),
  county: varchar("county", { length: 255 }),
  district: varchar("district", { length: 255 }),
  country: varchar("country", { length: 100 }).default("Portugal"),
  nif: varchar("nif", { length: 20 }),
  phone1: varchar("phone1", { length: 50 }),
  phone2: varchar("phone2", { length: 50 }),
  fax: varchar("fax", { length: 50 }),
  mobile1: varchar("mobile1", { length: 50 }),
  mobile2: varchar("mobile2", { length: 50 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  salesperson: varchar("salesperson", { length: 255 }),
  zone: varchar("zone", { length: 255 }),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0"),
  balance: decimal("balance", { precision: 12, scale: 2 }),
  active: int("active").default(1).notNull(),
  blocked: int("blocked").default(0).notNull(),
  clientSince: date("client_since"),
  comments: text("comments"),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CommercialClient = typeof commercialClients.$inferSelect;
export type InsertCommercialClient = typeof commercialClients.$inferInsert;
