import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
 * Tickets de assistência técnica
 */
export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketNumber: varchar("ticketNumber", { length: 20 }).notNull().unique(),
  clientId: int("clientId"),
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
