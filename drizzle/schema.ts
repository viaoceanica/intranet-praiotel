import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Utilizadores do sistema com autenticação autónoma
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: text("name").notNull(),
  role: mysqlEnum("role", ["admin", "gestor", "tecnico", "visualizador"]).default("visualizador").notNull(),
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
  equipment: varchar("equipment", { length: 255 }).notNull(),
  problemType: varchar("problemType", { length: 255 }).notNull(),
  priority: mysqlEnum("priority", ["baixa", "media", "alta", "urgente"]).default("media").notNull(),
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
  priority: mysqlEnum("priority", ["baixa", "media", "alta", "urgente"]).notNull().unique(),
  responseTimeHours: int("responseTimeHours").notNull(), // Tempo de resposta em horas
  resolutionTimeHours: int("resolutionTimeHours").notNull(), // Tempo de resolução em horas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SlaConfig = typeof slaConfig.$inferSelect;
export type InsertSlaConfig = typeof slaConfig.$inferInsert;
