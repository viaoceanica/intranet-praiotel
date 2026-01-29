import { getDb } from "./db";
import { crmTasks, users } from "../drizzle/schema";
import { sql, and, gte, lte, eq, count, desc } from "drizzle-orm";

/**
 * Get personal task statistics for a specific user
 */
export async function getPersonalTaskStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [stats] = await db
    .select({
      total: count(),
      completed: sql<number>`SUM(CASE WHEN ${crmTasks.status} = 'concluida' THEN 1 ELSE 0 END)`,
      pending: sql<number>`SUM(CASE WHEN ${crmTasks.status} = 'pendente' THEN 1 ELSE 0 END)`,
      inProgress: sql<number>`SUM(CASE WHEN ${crmTasks.status} = 'em_progresso' THEN 1 ELSE 0 END)`,
      overdue: sql<number>`SUM(CASE WHEN ${crmTasks.dueDate} < NOW() AND ${crmTasks.status} != 'concluida' THEN 1 ELSE 0 END)`,
      completedThisWeek: sql<number>`SUM(CASE WHEN ${crmTasks.status} = 'concluida' AND ${crmTasks.completedAt} >= ${startOfWeek} THEN 1 ELSE 0 END)`,
      completedThisMonth: sql<number>`SUM(CASE WHEN ${crmTasks.status} = 'concluida' AND ${crmTasks.completedAt} >= ${startOfMonth} THEN 1 ELSE 0 END)`,
    })
    .from(crmTasks)
    .where(eq(crmTasks.assignedToId, userId));

  return stats;
}

/**
 * Get tasks due today for a specific user
 */
export async function getTodayTasks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await db
    .select()
    .from(crmTasks)
    .where(
      and(
        eq(crmTasks.assignedToId, userId),
        gte(crmTasks.dueDate, today),
        lte(crmTasks.dueDate, tomorrow)
      )
    )
    .orderBy(crmTasks.priority, crmTasks.dueDate);

  return tasks;
}

/**
 * Get upcoming tasks (next 7 days) for a specific user
 */
export async function getUpcomingTasks(userId: number, days: number = 7) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + days);

  const tasks = await db
    .select()
    .from(crmTasks)
    .where(
      and(
        eq(crmTasks.assignedToId, userId),
        gte(crmTasks.dueDate, now),
        lte(crmTasks.dueDate, future)
      )
    )
    .orderBy(crmTasks.dueDate);

  return tasks;
}

/**
 * Get personal productivity timeline (last 30 days)
 */
export async function getPersonalProductivityTimeline(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const timeline = await db
    .select({
      date: sql<string>`DATE(${crmTasks.completedAt})`,
      count: count(),
    })
    .from(crmTasks)
    .where(
      and(
        eq(crmTasks.assignedToId, userId),
        eq(crmTasks.status, "concluida"),
        gte(crmTasks.completedAt, thirtyDaysAgo)
      )
    )
    .groupBy(sql`DATE(${crmTasks.completedAt})`)
    .orderBy(sql`DATE(${crmTasks.completedAt})`);

  return timeline;
}

/**
 * Get personal task distribution by priority
 */
export async function getPersonalTasksByPriority(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const distribution = await db
    .select({
      priority: crmTasks.priority,
      count: count(),
      completed: sql<number>`SUM(CASE WHEN ${crmTasks.status} = 'concluida' THEN 1 ELSE 0 END)`,
    })
    .from(crmTasks)
    .where(eq(crmTasks.assignedToId, userId))
    .groupBy(crmTasks.priority);

  return distribution;
}

/**
 * Get personal task distribution by type
 */
export async function getPersonalTasksByType(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const distribution = await db
    .select({
      type: crmTasks.type,
      count: count(),
      completed: sql<number>`SUM(CASE WHEN ${crmTasks.status} = 'concluida' THEN 1 ELSE 0 END)`,
    })
    .from(crmTasks)
    .where(eq(crmTasks.assignedToId, userId))
    .groupBy(crmTasks.type);

  return distribution;
}

/**
 * Get high priority tasks for a specific user
 */
export async function getHighPriorityTasks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const tasks = await db
    .select()
    .from(crmTasks)
    .where(
      and(
        eq(crmTasks.assignedToId, userId),
        sql`${crmTasks.priority} IN ('alta', 'urgente')`,
        sql`${crmTasks.status} != 'concluida'`
      )
    )
    .orderBy(desc(crmTasks.priority), crmTasks.dueDate)
    .limit(10);

  return tasks;
}
