import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import { tickets } from "../drizzle/schema";
import { getAllSlaConfigs } from "./slaDb";

/**
 * Estatísticas detalhadas de um técnico específico
 * @param technicianId ID do técnico
 * @param startDate Data inicial do período (opcional)
 * @param endDate Data final do período (opcional)
 */
export async function getTechnicianStats(technicianId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return null;

  // Obter todos os tickets do técnico (com filtro de período opcional)
  const whereConditions = [eq(tickets.assignedToId, technicianId)];
  
  // Aplicar filtro de período se fornecido
  if (startDate && endDate) {
    whereConditions.push(gte(tickets.createdAt, startDate));
    whereConditions.push(lte(tickets.createdAt, endDate));
  }

  const technicianTickets = await db
    .select()
    .from(tickets)
    .where(and(...whereConditions))
    .orderBy(desc(tickets.createdAt));

  const total = technicianTickets.length;
  const abertos = technicianTickets.filter(t => t.status === 'aberto').length;
  const emProgresso = technicianTickets.filter(t => t.status === 'em_progresso').length;
  const resolvidos = technicianTickets.filter(t => t.status === 'resolvido' || t.status === 'fechado').length;

  // Calcular tempo médio de resolução
  const resolvedTickets = technicianTickets.filter(t => t.resolvedAt || t.closedAt);
  let avgResolutionTimeMs = 0;
  if (resolvedTickets.length > 0) {
    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      const created = new Date(ticket.createdAt).getTime();
      const resolved = (ticket.resolvedAt || ticket.closedAt)!.getTime();
      return sum + (resolved - created);
    }, 0);
    avgResolutionTimeMs = totalTime / resolvedTickets.length;
  }

  // Calcular cumprimento de SLA
  const slaConfigs = await getAllSlaConfigs();
  let ticketsWithinSla = 0;
  let ticketsBreachedSla = 0;

  for (const ticket of resolvedTickets) {
    const slaConfig = slaConfigs.find(c => c.priority === ticket.priority);
    if (!slaConfig) continue;

    const resolvedDate = ticket.resolvedAt || ticket.closedAt;
    if (!resolvedDate) continue;

    const elapsed = resolvedDate.getTime() - ticket.createdAt.getTime();
    const hoursElapsed = elapsed / (1000 * 60 * 60);
    const slaHours = slaConfig.resolutionTimeHours;

    if (hoursElapsed <= slaHours) {
      ticketsWithinSla++;
    } else {
      ticketsBreachedSla++;
    }
  }

  const slaCompliancePercentage = resolvedTickets.length > 0
    ? Math.round((ticketsWithinSla / resolvedTickets.length) * 100)
    : 0;

  return {
    technicianId,
    total,
    abertos,
    emProgresso,
    resolvidos,
    avgResolutionTimeMs,
    ticketsWithinSla,
    ticketsBreachedSla,
    slaCompliancePercentage,
  };
}

/**
 * Comparação de todos os técnicos com médias da equipa
 * @param startDate Data inicial do período (opcional)
 * @param endDate Data final do período (opcional)
 */
export async function getAllTechniciansComparison(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];

  // Obter todos os utilizadores que são técnicos ou admin
  const { users } = await import("../drizzle/schema");
  const technicians = await db
    .select()
    .from(users)
    .where(
      sql`${users.role} IN ('tecnico', 'admin') AND ${users.active} = 1`
    );

  const stats = [];
  for (const tech of technicians) {
    const techStats = await getTechnicianStats(tech.id, startDate, endDate);
    if (techStats) {
      stats.push({
        id: tech.id,
        name: tech.name,
        email: tech.email,
        ...techStats,
      });
    }
  }

  // Calcular médias da equipa
  const teamTotal = stats.reduce((sum, s) => sum + s.total, 0);
  const teamResolved = stats.reduce((sum, s) => sum + s.resolvidos, 0);
  const teamAvgResolutionTime = stats.length > 0
    ? stats.reduce((sum, s) => sum + s.avgResolutionTimeMs, 0) / stats.length
    : 0;
  const teamAvgSlaCompliance = stats.length > 0
    ? stats.reduce((sum, s) => sum + s.slaCompliancePercentage, 0) / stats.length
    : 0;

  return {
    technicians: stats.sort((a, b) => b.slaCompliancePercentage - a.slaCompliancePercentage),
    teamAverages: {
      totalTickets: teamTotal,
      resolvedTickets: teamResolved,
      avgResolutionTimeMs: teamAvgResolutionTime,
      avgSlaCompliance: Math.round(teamAvgSlaCompliance),
    },
  };
}

/**
 * Histórico de tickets resolvidos por mês (últimos 6 meses)
 */
export async function getTechnicianMonthlyHistory(technicianId: number) {
  const db = await getDb();
  if (!db) return [];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const technicianTickets = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.assignedToId, technicianId),
        sql`${tickets.resolvedAt} IS NOT NULL OR ${tickets.closedAt} IS NOT NULL`
      )
    )
    .orderBy(desc(tickets.createdAt));

  // Agrupar por mês
  const monthlyData: Record<string, { resolved: number; withinSla: number }> = {};
  const slaConfigs = await getAllSlaConfigs();

  for (const ticket of technicianTickets) {
    const resolvedDate = ticket.resolvedAt || ticket.closedAt;
    if (!resolvedDate || resolvedDate < sixMonthsAgo) continue;

    const monthKey = `${resolvedDate.getFullYear()}-${String(resolvedDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { resolved: 0, withinSla: 0 };
    }

    monthlyData[monthKey].resolved++;

    // Verificar SLA
    const slaConfig = slaConfigs.find(c => c.priority === ticket.priority);
    if (slaConfig) {
      const elapsed = resolvedDate.getTime() - ticket.createdAt.getTime();
      const hoursElapsed = elapsed / (1000 * 60 * 60);
      if (hoursElapsed <= slaConfig.resolutionTimeHours) {
        monthlyData[monthKey].withinSla++;
      }
    }
  }

  // Converter para array ordenado
  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      resolved: data.resolved,
      withinSla: data.withinSla,
      slaPercentage: Math.round((data.withinSla / data.resolved) * 100),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
