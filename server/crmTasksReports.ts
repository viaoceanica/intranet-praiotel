import { getDb } from "./db";
import { crmTasks, users } from "../drizzle/schema";
import { sql, and, gte, lte, eq, count, avg, desc } from "drizzle-orm";

/**
 * Get task completion metrics for a given period
 */
export async function getTaskMetrics(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const [metrics] = await db
    .select({
      total: count(),
      completed: sql<number>`SUM(CASE WHEN ${crmTasks.status} = 'concluida' THEN 1 ELSE 0 END)`,
      pending: sql<number>`SUM(CASE WHEN ${crmTasks.status} = 'pendente' THEN 1 ELSE 0 END)`,
      inProgress: sql<number>`SUM(CASE WHEN ${crmTasks.status} = 'em_progresso' THEN 1 ELSE 0 END)`,
      overdue: sql<number>`SUM(CASE WHEN ${crmTasks.dueDate} < NOW() AND ${crmTasks.status} != 'concluida' THEN 1 ELSE 0 END)`,
    })
    .from(crmTasks)
    .where(
      and(
        gte(crmTasks.createdAt, startDate),
        lte(crmTasks.createdAt, endDate)
      )
    );

  return metrics;
}

/**
 * Get task distribution by type
 */
export async function getTasksByType(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const distribution = await db
    .select({
      type: crmTasks.type,
      count: count(),
      completed: sql<number>`SUM(CASE WHEN ${crmTasks.status} = 'concluida' THEN 1 ELSE 0 END)`,
    })
    .from(crmTasks)
    .where(
      and(
        gte(crmTasks.createdAt, startDate),
        lte(crmTasks.createdAt, endDate)
      )
    )
    .groupBy(crmTasks.type);

  return distribution;
}

/**
 * Get task distribution by priority
 */
export async function getTasksByPriority(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const distribution = await db
    .select({
      priority: crmTasks.priority,
      count: count(),
      completed: sql<number>`SUM(CASE WHEN ${crmTasks.status} = 'concluida' THEN 1 ELSE 0 END)`,
    })
    .from(crmTasks)
    .where(
      and(
        gte(crmTasks.createdAt, startDate),
        lte(crmTasks.createdAt, endDate)
      )
    )
    .groupBy(crmTasks.priority);

  return distribution;
}

/**
 * Get user productivity ranking
 */
export async function getUserProductivity(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const ranking = await db
    .select({
      userId: crmTasks.assignedToId,
      userName: users.name,
      totalTasks: count(),
      completedTasks: sql<number>`SUM(CASE WHEN ${crmTasks.status} = 'concluida' THEN 1 ELSE 0 END)`,
      completionRate: sql<number>`ROUND(SUM(CASE WHEN ${crmTasks.status} = 'concluida' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2)`,
    })
    .from(crmTasks)
    .leftJoin(users, eq(crmTasks.assignedToId, users.id))
    .where(
      and(
        gte(crmTasks.createdAt, startDate),
        lte(crmTasks.createdAt, endDate)
      )
    )
    .groupBy(crmTasks.assignedToId, users.name)
    .orderBy(desc(sql`completion_rate`));

  return ranking;
}

/**
 * Get task completion timeline (daily aggregation)
 */
export async function getCompletionTimeline(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const timeline = await db
    .select({
      date: sql<string>`DATE(${crmTasks.completedAt})`,
      count: count(),
    })
    .from(crmTasks)
    .where(
      and(
        eq(crmTasks.status, "concluida"),
        gte(crmTasks.completedAt, startDate),
        lte(crmTasks.completedAt, endDate)
      )
    )
    .groupBy(sql`DATE(${crmTasks.completedAt})`)
    .orderBy(sql`DATE(${crmTasks.completedAt})`);

  return timeline;
}

/**
 * Get average completion time by priority
 */
export async function getAvgCompletionTime(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const avgTimes = await db
    .select({
      priority: crmTasks.priority,
      avgHours: sql<number>`ROUND(AVG(TIMESTAMPDIFF(HOUR, ${crmTasks.createdAt}, ${crmTasks.completedAt})), 2)`,
    })
    .from(crmTasks)
    .where(
      and(
        eq(crmTasks.status, "concluida"),
        gte(crmTasks.createdAt, startDate),
        lte(crmTasks.createdAt, endDate)
      )
    )
    .groupBy(crmTasks.priority);

  return avgTimes;
}
