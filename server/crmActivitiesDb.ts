import { getDb } from "./db.js";
import { crmActivities } from "../drizzle/schema.js";
import { eq, or, and, desc, isNotNull } from "drizzle-orm";

// Get all activities for a lead
export async function getActivitiesByLead(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(crmActivities)
    .where(eq(crmActivities.leadId, leadId))
    .orderBy(desc(crmActivities.activityDate));
}

// Get all activities for an opportunity
export async function getActivitiesByOpportunity(opportunityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(crmActivities)
    .where(eq(crmActivities.opportunityId, opportunityId))
    .orderBy(desc(crmActivities.activityDate));
}

// Get all activities for a client
export async function getActivitiesByClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(crmActivities)
    .where(eq(crmActivities.clientId, clientId))
    .orderBy(desc(crmActivities.activityDate));
}

// Get activity by ID
export async function getActivityById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const results = await db.select().from(crmActivities)
    .where(eq(crmActivities.id, id));
  return results[0] || null;
}

// Create new activity
export async function createActivity(data: {
  type: 'chamada' | 'email' | 'reuniao' | 'nota' | 'tarefa_concluida';
  leadId?: number;
  opportunityId?: number;
  clientId?: number;
  subject: string;
  description?: string;
  activityDate: Date;
  duration?: number;
  outcome?: string;
  userId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(crmActivities).values({
    type: data.type,
    leadId: data.leadId || null,
    opportunityId: data.opportunityId || null,
    clientId: data.clientId || null,
    subject: data.subject,
    description: data.description || null,
    activityDate: data.activityDate,
    duration: data.duration || null,
    outcome: data.outcome || null,
    userId: data.userId,
    createdAt: new Date(),
  });
  return result[0].insertId;
}

// Update activity
export async function updateActivity(id: number, data: {
  subject?: string;
  description?: string;
  activityDate?: Date;
  duration?: number;
  outcome?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(crmActivities)
    .set(data)
    .where(eq(crmActivities.id, id));
  return getActivityById(id);
}

// Delete activity
export async function deleteActivity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(crmActivities).where(eq(crmActivities.id, id));
  return true;
}

// Get recent activities (for dashboard)
export async function getRecentActivities(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(crmActivities)
    .orderBy(desc(crmActivities.activityDate))
    .limit(limit);
}

// Get activities by user
export async function getActivitiesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(crmActivities)
    .where(eq(crmActivities.userId, userId))
    .orderBy(desc(crmActivities.activityDate));
}
