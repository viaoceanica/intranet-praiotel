import { getDb } from "./db.js";
import { crmTasks, crmLeads, crmOpportunities, clients, users } from "../drizzle/schema.js";
import { eq, and, or, desc, asc, gte, lte, isNull, isNotNull } from "drizzle-orm";

// Get all tasks with optional filters
export async function getAllTasks(filters?: {
  status?: string;
  priority?: string;
  type?: string;
  assignedToId?: number;
  leadId?: number;
  opportunityId?: number;
  clientId?: number;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  overdue?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select({
    task: crmTasks,
    lead: crmLeads,
    opportunity: crmOpportunities,
    client: clients,
    assignedTo: users,
  })
  .from(crmTasks)
  .leftJoin(crmLeads, eq(crmTasks.leadId, crmLeads.id))
  .leftJoin(crmOpportunities, eq(crmTasks.opportunityId, crmOpportunities.id))
  .leftJoin(clients, eq(crmTasks.clientId, clients.id))
  .leftJoin(users, eq(crmTasks.assignedToId, users.id));
  
  const conditions = [];
  
  if (filters?.status) {
    conditions.push(eq(crmTasks.status, filters.status as any));
  }
  
  if (filters?.priority) {
    conditions.push(eq(crmTasks.priority, filters.priority as any));
  }
  
  if (filters?.type) {
    conditions.push(eq(crmTasks.type, filters.type as any));
  }
  
  if (filters?.assignedToId) {
    conditions.push(eq(crmTasks.assignedToId, filters.assignedToId));
  }
  
  if (filters?.leadId) {
    conditions.push(eq(crmTasks.leadId, filters.leadId));
  }
  
  if (filters?.opportunityId) {
    conditions.push(eq(crmTasks.opportunityId, filters.opportunityId));
  }
  
  if (filters?.clientId) {
    conditions.push(eq(crmTasks.clientId, filters.clientId));
  }
  
  if (filters?.dueDateFrom) {
    conditions.push(gte(crmTasks.dueDate, filters.dueDateFrom));
  }
  
  if (filters?.dueDateTo) {
    conditions.push(lte(crmTasks.dueDate, filters.dueDateTo));
  }
  
  if (filters?.overdue) {
    conditions.push(
      and(
        lte(crmTasks.dueDate, new Date()),
        or(
          eq(crmTasks.status, "pendente"),
          eq(crmTasks.status, "em_progresso")
        )
      )
    );
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.orderBy(asc(crmTasks.dueDate));
}

// Get task by ID
export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db.select({
    task: crmTasks,
    lead: crmLeads,
    opportunity: crmOpportunities,
    client: clients,
    assignedTo: users,
  })
  .from(crmTasks)
  .leftJoin(crmLeads, eq(crmTasks.leadId, crmLeads.id))
  .leftJoin(crmOpportunities, eq(crmTasks.opportunityId, crmOpportunities.id))
  .leftJoin(clients, eq(crmTasks.clientId, clients.id))
  .leftJoin(users, eq(crmTasks.assignedToId, users.id))
  .where(eq(crmTasks.id, id));
  
  return results[0] || null;
}

// Create new task
export async function createTask(data: {
  title: string;
  description?: string;
  type: 'chamada' | 'email' | 'reuniao' | 'follow_up' | 'outro';
  leadId?: number;
  opportunityId?: number;
  clientId?: number;
  assignedToId: number;
  status?: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada';
  priority?: 'baixa' | 'media' | 'alta' | 'urgente';
  dueDate: Date;
  reminderMinutes?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(crmTasks).values({
    title: data.title,
    description: data.description || null,
    type: data.type,
    leadId: data.leadId || null,
    opportunityId: data.opportunityId || null,
    clientId: data.clientId || null,
    assignedToId: data.assignedToId,
    status: data.status || "pendente",
    priority: data.priority || "media",
    dueDate: data.dueDate,
    reminderMinutes: data.reminderMinutes || 30,
    reminderSent: 0,
    createdAt: new Date(),
  });
  
  return result[0].insertId;
}

// Update task
export async function updateTask(id: number, data: {
  title?: string;
  description?: string;
  type?: 'chamada' | 'email' | 'reuniao' | 'follow_up' | 'outro';
  assignedToId?: number;
  status?: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada';
  priority?: 'baixa' | 'media' | 'alta' | 'urgente';
  dueDate?: Date;
  reminderMinutes?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(crmTasks)
    .set(data)
    .where(eq(crmTasks.id, id));
  
  return getTaskById(id);
}

// Complete task
export async function completeTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(crmTasks)
    .set({
      status: "concluida",
      completedAt: new Date(),
    })
    .where(eq(crmTasks.id, id));
  
  return getTaskById(id);
}

// Delete task
export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(crmTasks).where(eq(crmTasks.id, id));
  return true;
}

// Get tasks by lead
export async function getTasksByLead(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select({
    task: crmTasks,
    assignedTo: users,
  })
  .from(crmTasks)
  .leftJoin(users, eq(crmTasks.assignedToId, users.id))
  .where(eq(crmTasks.leadId, leadId))
  .orderBy(asc(crmTasks.dueDate));
}

// Get tasks by opportunity
export async function getTasksByOpportunity(opportunityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select({
    task: crmTasks,
    assignedTo: users,
  })
  .from(crmTasks)
  .leftJoin(users, eq(crmTasks.assignedToId, users.id))
  .where(eq(crmTasks.opportunityId, opportunityId))
  .orderBy(asc(crmTasks.dueDate));
}

// Get tasks by client
export async function getTasksByClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select({
    task: crmTasks,
    assignedTo: users,
  })
  .from(crmTasks)
  .leftJoin(users, eq(crmTasks.assignedToId, users.id))
  .where(eq(crmTasks.clientId, clientId))
  .orderBy(asc(crmTasks.dueDate));
}

// Get tasks by assigned user
export async function getTasksByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select({
    task: crmTasks,
    lead: crmLeads,
    opportunity: crmOpportunities,
    client: clients,
  })
  .from(crmTasks)
  .leftJoin(crmLeads, eq(crmTasks.leadId, crmLeads.id))
  .leftJoin(crmOpportunities, eq(crmTasks.opportunityId, crmOpportunities.id))
  .leftJoin(clients, eq(crmTasks.clientId, clients.id))
  .where(eq(crmTasks.assignedToId, userId))
  .orderBy(asc(crmTasks.dueDate));
}

// Get overdue tasks
export async function getOverdueTasks() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select({
    task: crmTasks,
    lead: crmLeads,
    opportunity: crmOpportunities,
    client: clients,
    assignedTo: users,
  })
  .from(crmTasks)
  .leftJoin(crmLeads, eq(crmTasks.leadId, crmLeads.id))
  .leftJoin(crmOpportunities, eq(crmTasks.opportunityId, crmOpportunities.id))
  .leftJoin(clients, eq(crmTasks.clientId, clients.id))
  .leftJoin(users, eq(crmTasks.assignedToId, users.id))
  .where(
    and(
      lte(crmTasks.dueDate, new Date()),
      or(
        eq(crmTasks.status, "pendente"),
        eq(crmTasks.status, "em_progresso")
      )
    )
  )
  .orderBy(asc(crmTasks.dueDate));
}

// Get task statistics
export async function getTaskStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allTasks = await db.select().from(crmTasks);
  
  const stats = {
    total: allTasks.length,
    pendente: allTasks.filter(t => t.status === "pendente").length,
    em_progresso: allTasks.filter(t => t.status === "em_progresso").length,
    concluida: allTasks.filter(t => t.status === "concluida").length,
    cancelada: allTasks.filter(t => t.status === "cancelada").length,
    overdue: allTasks.filter(t => 
      new Date(t.dueDate) < new Date() && 
      (t.status === "pendente" || t.status === "em_progresso")
    ).length,
  };
  
  return stats;
}
