import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as ticketsDb from "./ticketsDb";
import * as notificationsDb from "./notificationsDb";
import * as clientsDb from "./clientsDb";
import * as slaDb from "./slaDb";
import * as slaNotifications from "./slaNotifications";
import * as equipmentDb from "./equipmentDb";
import * as prioritizationDb from "./prioritizationDb";
import * as responseTemplatesDb from "./responseTemplatesDb";
import * as technicianStatsDb from "./technicianStatsDb";
import * as notificationHelpers from "./notificationHelpers";
import * as customRolesDb from "./customRolesDb";
import * as internalManagementDb from "./internalManagementDb";
import * as favoritesDb from "./favoritesDb";
import * as internalManagementAnalyticsDb from "./internalManagementAnalyticsDb";
import * as articleCommentsDb from "./articleCommentsDb";
import * as articleReadsDb from "./articleReadsDb";
import * as tagsDb from "./tagsDb";
import * as crmLeadsDb from "./crmLeadsDb";
import * as crmOpportunitiesDb from "./crmOpportunitiesDb";
import * as crmActivitiesDb from "./crmActivitiesDb";
import * as crmTasksDb from "./crmTasksDb";
import * as crmTasksReports from "./crmTasksReports";
import * as crmTasksPersonal from "./crmTasksPersonal";
import * as crmCampaignsDb from "./crmCampaignsDb";
import * as crmLeadScoringDb from "./crmLeadScoringDb";
import * as crmEmailTemplatesDb from "./crmEmailTemplatesDb";
import * as crmWorkflowsDb from "./crmWorkflowsDb";
import * as crmDuplicatesDb from "./crmDuplicatesDb";
import * as systemSettingsDb from "./systemSettingsDb";
import * as commercialClientsDb from "./commercialClientsDb";
import * as XLSX from "xlsx";
import { storagePut } from "./storage";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";

const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret);

// Middleware para verificar autenticação
const isAuthenticated = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Middleware para verificar role de admin
const isAdmin = isAuthenticated.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
  }
  return next({ ctx });
});

// Middleware para verificar permissões específicas
const requirePermissions = (permissions: string[]) => {
  return isAuthenticated.use(async ({ ctx, next }) => {
    const { hasPermission } = await import("./permissions");
    
    for (const permission of permissions) {
      const hasAccess = await hasPermission(ctx.user.role, permission as any);
      if (!hasAccess) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: `Permissão necessária: ${permission}` 
        });
      }
    }
    
    return next({ ctx });
  });
};

export const appRouter = router({
  sla: router({
    list: isAuthenticated.query(async () => {
      return await slaDb.getAllSlaConfigs();
    }),

    getByPriority: isAuthenticated
      .input(z.object({ priority: z.string() }))
      .query(async ({ input }) => {
        return await slaDb.getSlaConfig(input.priority);
      }),

    update: isAdmin
      .input(z.object({
        priority: z.string(),
        responseTimeHours: z.number().min(1),
        resolutionTimeHours: z.number().min(1),
      }))
      .mutation(async ({ input }) => {
        const { priority, ...data } = input;
        await slaDb.updateSlaConfig(priority, data);
        return { success: true };
      }),

    create: isAdmin
      .input(z.object({
        priority: z.string().min(1).max(50),
        displayName: z.string().min(1).max(100),
        responseTimeHours: z.number().min(1),
        resolutionTimeHours: z.number().min(1),
      }))
      .mutation(async ({ input }) => {
        await slaDb.createSlaConfig({ ...input, isCustom: 1 });
        return { success: true };
      }),

    delete: isAdmin
      .input(z.object({ priority: z.string() }))
      .mutation(async ({ input }) => {
        const config = await slaDb.getSlaConfig(input.priority);
        if (!config || !config.isCustom) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Não é possível eliminar prioridades base" 
          });
        }
        await slaDb.deleteSlaConfig(input.priority);
        return { success: true };
      }),

    calculateStatus: isAuthenticated
      .input(z.object({
        createdAt: z.date(),
        priority: z.string(),
        resolvedAt: z.date().optional(),
      }))
      .query(async ({ input }) => {
        const slaConfig = await slaDb.getSlaConfig(input.priority);
        if (!slaConfig) {
          return null;
        }
        return slaDb.calculateSlaStatus(
          input.createdAt,
          input.priority,
          slaConfig.resolutionTimeHours,
          input.resolvedAt
        );
      }),

    metrics: isAuthenticated.query(async () => {
      return await ticketsDb.getSlaMetrics();
    }),

    technicianRanking: isAuthenticated.query(async () => {
      const ranking = await ticketsDb.getTechnicianSlaRanking();
      // Preencher nomes dos técnicos
      const users = await db.getAllUsers();
      return ranking.map(r => ({
        ...r,
        name: users.find(u => u.id === r.technicianId)?.name || 'Desconhecido',
      }));
    }),

    checkAndNotify: isAdmin.mutation(async () => {
      const result = await slaNotifications.checkAndNotifySla();
      return result;
    }),
  }),

  system: systemRouter,

  menuOrder: router({
    get: isAuthenticated.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const database = await getDb();
      if (!database) return null;
      const { userMenuOrder } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const result = await database.select().from(userMenuOrder).where(eq(userMenuOrder.userId, ctx.user.id)).limit(1);
      if (result.length === 0) return null;
      return JSON.parse(result[0].menuOrder) as string[];
    }),

    save: isAuthenticated
      .input(z.object({ order: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { userMenuOrder } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const existing = await database.select().from(userMenuOrder).where(eq(userMenuOrder.userId, ctx.user.id)).limit(1);
        if (existing.length > 0) {
          await database.update(userMenuOrder).set({ menuOrder: JSON.stringify(input.order) }).where(eq(userMenuOrder.userId, ctx.user.id));
        } else {
          await database.insert(userMenuOrder).values({ userId: ctx.user.id, menuOrder: JSON.stringify(input.order) });
        }
        return { success: true };
      }),
  }),

  technicianStats: router({
    // Estatísticas de um técnico específico
    byTechnician: isAuthenticated
      .input(z.object({ 
        technicianId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await technicianStatsDb.getTechnicianStats(input.technicianId, input.startDate, input.endDate);
      }),

    // Comparação de todos os técnicos
    comparison: isAuthenticated
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await technicianStatsDb.getAllTechniciansComparison(input?.startDate, input?.endDate);
      }),

    // Histórico mensal de um técnico
    monthlyHistory: isAuthenticated
      .input(z.object({ technicianId: z.number() }))
      .query(async ({ input }) => {
        return await technicianStatsDb.getTechnicianMonthlyHistory(input.technicianId);
      }),
  }),
  
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        
        if (!user || !user.active) {
          throw new TRPCError({ 
            code: "UNAUTHORIZED", 
            message: "Credenciais inválidas" 
          });
        }

        const validPassword = await bcrypt.compare(input.password, user.passwordHash);
        
        if (!validPassword) {
          throw new TRPCError({ 
            code: "UNAUTHORIZED", 
            message: "Credenciais inválidas" 
          });
        }

        // Atualizar último login
        await db.updateUser(user.id, { lastSignedIn: new Date() });

        // Criar JWT token
        const token = await new SignJWT({ userId: user.id })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("7d")
          .sign(JWT_SECRET);

        // Definir cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),

    changePassword: isAuthenticated
      .input(z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6, "A nova password deve ter pelo menos 6 caracteres"),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Utilizador n\u00e3o encontrado" });
        }

        const validPassword = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!validPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Password atual incorreta" });
        }

        const newHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUser(user.id, { passwordHash: newHash });

        return { success: true };
      }),

    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        
        // Sempre retornar sucesso para n\u00e3o revelar se o email existe
        if (!user) {
          return { success: true, message: "Se o email existir no sistema, receber\u00e1 instru\u00e7\u00f5es para recuperar a password." };
        }

        // Gerar token aleat\u00f3rio
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await db.createPasswordResetToken(user.id, token, expiresAt);

        // Retornar o token (em produ\u00e7\u00e3o seria enviado por email)
        return { 
          success: true, 
          message: "Se o email existir no sistema, receber\u00e1 instru\u00e7\u00f5es para recuperar a password.",
          // Em ambiente de desenvolvimento, retornar o token para facilitar testes
          resetToken: token,
        };
      }),

    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1),
        newPassword: z.string().min(6, "A nova password deve ter pelo menos 6 caracteres"),
      }))
      .mutation(async ({ input }) => {
        const resetToken = await db.getValidPasswordResetToken(input.token);
        
        if (!resetToken) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Token inv\u00e1lido ou expirado. Solicite uma nova recupera\u00e7\u00e3o de password." 
          });
        }

        const newHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUser(resetToken.userId, { passwordHash: newHash });
        await db.markPasswordResetTokenUsed(input.token);

        return { success: true };
      }),

    getPermissions: isAuthenticated.query(async ({ ctx }) => {
      const { getUserPermissions } = await import("./permissions");
      const permissions = await getUserPermissions(ctx.user.role);
      return Array.from(permissions);
    }),
  }),

  users: router({
    list: isAuthenticated.query(async () => {
      const users = await db.getAllUsers();
      return users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        active: u.active,
        createdAt: u.createdAt,
        lastSignedIn: u.lastSignedIn,
      }));
    }),

    create: isAdmin
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        role: z.enum(["admin", "gestor", "tecnico", "visualizador"]),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ 
            code: "CONFLICT", 
            message: "Email já existe" 
          });
        }

        const passwordHash = await bcrypt.hash(input.password, 10);
        
        await db.createUser({
          email: input.email,
          passwordHash,
          name: input.name,
          role: input.role,
          active: 1,
        });

        return { success: true };
      }),

    update: isAdmin
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        role: z.enum(["admin", "gestor", "tecnico", "visualizador"]).optional(),
        active: z.boolean().optional(),
        password: z.string().min(6).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, password, ...updateData } = input;
        
        const dataToUpdate: any = { ...updateData };
        
        if (password) {
          dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
        }

        await db.updateUser(id, dataToUpdate);
        return { success: true };
      }),

    delete: isAdmin
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (input.id === ctx.user.id) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Não pode eliminar o próprio utilizador" 
          });
        }

        await db.deleteUser(input.id);
        return { success: true };
      }),
  }),

  tickets: router({
    list: isAuthenticated.query(async () => {
      const allTickets = await ticketsDb.getAllTickets();
      return allTickets;
    }),

    myTickets: isAuthenticated.query(async ({ ctx }) => {
      const allTickets = await ticketsDb.getAllTickets();
      return allTickets.filter(t => t.assignedToId === ctx.user.id);
    }),

    listByClient: isAuthenticated
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await ticketsDb.getTicketsByClientId(input.clientId);
      }),

    recentByClient: isAuthenticated
      .input(z.object({ clientId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await ticketsDb.getRecentTicketsByClientId(input.clientId, input.limit);
      }),

    clientStats: isAuthenticated
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await ticketsDb.getClientTicketStats(input.clientId);
      }),

    dashboardStats: isAuthenticated.query(async () => {
      const allTickets = await ticketsDb.getAllTickets();
      
      // Estatísticas gerais
      const total = allTickets.length;
      const porEstado = {
        aberto: allTickets.filter(t => t.status === 'aberto').length,
        em_progresso: allTickets.filter(t => t.status === 'em_progresso').length,
        resolvido: allTickets.filter(t => t.status === 'resolvido').length,
        fechado: allTickets.filter(t => t.status === 'fechado').length,
      };
      
      const porPrioridade = {
        baixa: allTickets.filter(t => t.priority === 'baixa').length,
        media: allTickets.filter(t => t.priority === 'media').length,
        alta: allTickets.filter(t => t.priority === 'alta').length,
        urgente: allTickets.filter(t => t.priority === 'urgente').length,
      };

      // Ranking de clientes (apenas tickets com clientId)
      const ticketsComCliente = allTickets.filter(t => t.clientId);
      const clienteCount: Record<number, { count: number; clientName: string }> = {};
      ticketsComCliente.forEach(t => {
        if (t.clientId) {
          if (!clienteCount[t.clientId]) {
            clienteCount[t.clientId] = { count: 0, clientName: t.clientName };
          }
          clienteCount[t.clientId].count++;
        }
      });
      
      const topClientes = Object.entries(clienteCount)
        .map(([id, data]) => ({ clientId: parseInt(id), ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Tempo médio de resolução
      const resolvedTickets = allTickets.filter(t => t.resolvedAt);
      let avgResolutionTime = 0;
      if (resolvedTickets.length > 0) {
        const totalTime = resolvedTickets.reduce((sum, ticket) => {
          const created = new Date(ticket.createdAt).getTime();
          const resolved = new Date(ticket.resolvedAt!).getTime();
          return sum + (resolved - created);
        }, 0);
        avgResolutionTime = totalTime / resolvedTickets.length;
      }

      return {
        total,
        porEstado,
        porPrioridade,
        topClientes,
        avgResolutionTimeMs: avgResolutionTime,
      };
    }),

    getById: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const ticket = await ticketsDb.getTicketById(input.id);
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ticket não encontrado" });
        }
        return ticket;
      }),

    create: isAuthenticated
      .input(z.object({
        clientId: z.number().optional(),
        commercialClientId: z.number().optional(),
        clientType: z.enum(["assistencia", "comercial"]).default("assistencia"),
        clientName: z.string().min(1),
        equipment: z.string().min(1),
        problemType: z.string().min(1),
        priority: z.enum(["baixa", "media", "alta", "urgente"]),
        location: z.string().min(1),
        description: z.string().min(1),
        assignedToId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ticketNumber = await ticketsDb.generateTicketNumber();
        
        // Aplicar priorização automática
        let finalPriority = input.priority;
        const autoPriority = await prioritizationDb.applyAutoPrioritization({
          clientId: input.clientId,
          equipment: input.equipment,
          description: input.description,
          problemType: input.problemType,
          currentPriority: input.priority,
        });

        if (autoPriority && autoPriority.newPriority !== input.priority) {
          finalPriority = autoPriority.newPriority as any;
        }

        const ticketData = {
          ticketNumber,
          clientId: input.clientType === "assistencia" ? input.clientId : undefined,
          commercialClientId: input.clientType === "comercial" ? input.commercialClientId : undefined,
          clientType: input.clientType,
          clientName: input.clientName,
          equipment: input.equipment,
          problemType: input.problemType,
          priority: finalPriority,
          status: "aberto" as const,
          location: input.location,
          description: input.description,
          assignedToId: input.assignedToId,
          createdById: ctx.user.id,
        };

        await ticketsDb.createTicket(ticketData);

        // Obter ID do ticket recém-criado
        const createdTicket = await ticketsDb.getTicketByNumber(ticketNumber);

        // Notificar técnico se ticket foi atribuído
        if (input.assignedToId) {
          await notificationHelpers.notifyTicketAssigned(
            createdTicket!.id,
            ticketNumber,
            input.assignedToId
          );
        }
        if (!createdTicket) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar ticket" });
        }

        // Registar alteração de prioridade se foi automática
        if (autoPriority && autoPriority.newPriority !== input.priority) {
          await prioritizationDb.logPriorityChange({
            ticketId: createdTicket.id,
            oldPriority: input.priority,
            newPriority: autoPriority.newPriority as any,
            changedBy: "auto",
            reason: autoPriority.reason,
            ruleId: autoPriority.ruleId,
          });

          // Notificar sobre ajuste automático
          if (input.assignedToId) {
            await notificationsDb.createNotification({
              userId: input.assignedToId,
              type: "ticket_assigned",
              title: "Prioridade ajustada automaticamente",
              message: `Ticket ${ticketNumber}: Prioridade alterada de ${input.priority} para ${autoPriority.newPriority}. Razão: ${autoPriority.reason}`,
              ticketId: createdTicket.id,
            });
          }
        }

        // Notificar técnico atribuído
        if (input.assignedToId) {
          await notificationsDb.createNotification({
            userId: input.assignedToId,
            type: "ticket_assigned",
            title: "Novo ticket atribuído",
            message: `O ticket ${ticketNumber} foi-lhe atribuído: ${input.clientName} - ${input.equipment}`,
            ticketId: undefined, // Será preenchido após obter o ID
          });
        }

        return { success: true, ticketNumber };
      }),

    update: isAuthenticated
      .input(z.object({
        id: z.number(),
        clientName: z.string().min(1).optional(),
        equipment: z.string().min(1).optional(),
        problemType: z.string().min(1).optional(),
        priority: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
        status: z.enum(["aberto", "em_progresso", "resolvido", "fechado"]).optional(),
        location: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        notes: z.string().optional(),
        assignedToId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updateData } = input;
        
        const ticket = await ticketsDb.getTicketById(id);
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ticket não encontrado" });
        }

        const dataToUpdate: any = { ...updateData };

        // Registar alterações no histórico
        if (input.status && input.status !== ticket.status) {
          await ticketsDb.createTicketHistory({
            ticketId: id,
            userId: ctx.user.id,
            action: "status_change",
            fieldChanged: "status",
            oldValue: ticket.status,
            newValue: input.status,
          });

          if (input.status === "resolvido") {
            dataToUpdate.resolvedAt = new Date();
          } else if (input.status === "fechado") {
            dataToUpdate.closedAt = new Date();
          }

          // Notificar técnico atribuído sobre mudança de estado
          await notificationHelpers.notifyTicketStatusChanged(
            id,
            ticket.ticketNumber,
            ticket.assignedToId,
            input.status,
            ctx.user.id
          );
        }

        // Notificar sobre nova atribuição
        if (input.assignedToId && input.assignedToId !== ticket.assignedToId) {
          await notificationHelpers.notifyTicketAssigned(
            id,
            ticket.ticketNumber,
            input.assignedToId
          );
        }

        await ticketsDb.updateTicket(id, dataToUpdate);
        return { success: true };
      }),

    delete: isAdmin
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await ticketsDb.deleteTicket(input.id);
        return { success: true };
      }),

    getAttachments: isAuthenticated
      .input(z.object({ ticketId: z.number() }))
      .query(async ({ input }) => {
        return await ticketsDb.getTicketAttachments(input.ticketId);
      }),

    getHistory: isAuthenticated
      .input(z.object({ ticketId: z.number() }))
      .query(async ({ input }) => {
        return await ticketsDb.getTicketHistory(input.ticketId);
      }),

    uploadAttachment: isAuthenticated
      .input(z.object({
        ticketId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ticket = await ticketsDb.getTicketById(input.ticketId);
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ticket não encontrado" });
        }

        // Converter base64 para buffer
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // Upload para S3
        const fileKey = `tickets/${input.ticketId}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Guardar na base de dados
        await ticketsDb.createAttachment({
          ticketId: input.ticketId,
          fileName: input.fileName,
          fileUrl: url,
          fileKey: fileKey,
          mimeType: input.mimeType,
          fileSize: buffer.length,
          uploadedById: ctx.user.id,
        });

        return { success: true, url };
      }),

    deleteAttachment: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await ticketsDb.deleteAttachment(input.id);
        return { success: true };
      }),

    addNote: isAuthenticated
      .input(z.object({
        ticketId: z.number(),
        note: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        await ticketsDb.createTicketHistory({
          ticketId: input.ticketId,
          userId: ctx.user.id,
          action: "note_added",
          fieldChanged: "notes",
          newValue: input.note,
        });

        // Notificar técnico atribuído sobre novo comentário
        const ticket = await ticketsDb.getTicketById(input.ticketId);
        if (ticket) {
          await notificationHelpers.notifyCommentAdded(
            input.ticketId,
            ticket.ticketNumber,
            ticket.assignedToId,
            ctx.user.id
          );
        }

        return { success: true };
      }),
  }),

  notifications: router({
    list: isAuthenticated.query(async ({ ctx }) => {
      return await notificationsDb.getUserNotifications(ctx.user.id);
    }),

    getUnread: isAuthenticated.query(async ({ ctx }) => {
      return await notificationsDb.getUnreadNotifications(ctx.user.id);
    }),

    unreadCount: isAuthenticated.query(async ({ ctx }) => {
      return await notificationsDb.getUnreadCount(ctx.user.id);
    }),

    markAsRead: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await notificationsDb.markAsRead(input.id);
        return { success: true };
      }),

    markAllAsRead: isAuthenticated.mutation(async ({ ctx }) => {
      await notificationsDb.markAllAsRead(ctx.user.id);
      return { success: true };
    }),

    delete: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await notificationsDb.deleteNotification(input.id);
        return { success: true };
      }),
  }),

  clients: router({
    list: isAuthenticated.query(async () => {
      return await clientsDb.getAllClients();
    }),

    search: isAuthenticated
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await clientsDb.searchClients(input.query);
      }),

    // Pesquisa unificada em ambas as tabelas (assistência + comercial)
    searchAll: isAuthenticated
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await clientsDb.searchAllClients(input.query);
      }),

    getById: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await clientsDb.getClientById(input.id);
      }),

    create: isAuthenticated
      .input(z.object({
        designation: z.string().min(1),
        address: z.string().optional(),
        primaryEmail: z.string().email(),
        nif: z.string().min(1),
        responsiblePerson: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await clientsDb.createClient(input);
        return { success: true, id: Number(result[0].insertId), designation: input.designation, nif: input.nif };
      }),

    update: isAuthenticated
      .input(z.object({
        id: z.number(),
        designation: z.string().min(1).optional(),
        address: z.string().optional(),
        primaryEmail: z.string().email().optional(),
        nif: z.string().min(1).optional(),
        responsiblePerson: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await clientsDb.updateClient(id, data);
        return { success: true };
      }),

    delete: requirePermissions(["canDeleteTickets"])
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await ticketsDb.deleteTicket(input.id);
        return { success: true };
      }),

    getEmails: isAuthenticated
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await clientsDb.getClientEmails(input.clientId);
      }),

    addEmail: isAuthenticated
      .input(z.object({
        clientId: z.number(),
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        await clientsDb.addClientEmail(input);
        return { success: true };
      }),

    deleteEmail: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await clientsDb.deleteClientEmail(input.id);
        return { success: true };
      }),
  }),

  equipment: router({
    list: isAuthenticated.query(async () => {
      return await equipmentDb.getAllEquipment();
    }),

    search: isAuthenticated
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await equipmentDb.searchEquipment(input.query);
      }),

    getById: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await equipmentDb.getEquipmentById(input.id);
      }),

    getByClient: isAuthenticated
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await equipmentDb.getEquipmentByClientId(input.clientId);
      }),

    getHistory: isAuthenticated
      .input(z.object({ equipmentId: z.number() }))
      .query(async ({ input }) => {
        return await equipmentDb.getEquipmentTicketHistory(input.equipmentId);
      }),

    getStats: isAuthenticated
      .input(z.object({ equipmentId: z.number() }))
      .query(async ({ input }) => {
        return await equipmentDb.getEquipmentStats(input.equipmentId);
      }),

    getCritical: isAuthenticated.query(async () => {
      return await equipmentDb.getCriticalEquipment();
    }),

    create: isAuthenticated
      .input(z.object({
        serialNumber: z.string().min(1),
        brand: z.string().min(1),
        model: z.string().min(1),
        category: z.string().optional(),
        location: z.string().optional(),
        clientId: z.number().optional(),
        isCritical: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await equipmentDb.createEquipment(input);
        return { success: true };
      }),

    update: isAuthenticated
      .input(z.object({
        id: z.number(),
        serialNumber: z.string().min(1).optional(),
        brand: z.string().min(1).optional(),
        model: z.string().min(1).optional(),
        category: z.string().optional(),
        location: z.string().optional(),
        clientId: z.number().optional(),
        isCritical: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await equipmentDb.updateEquipment(id, data);
        return { success: true };
      }),

    delete: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await equipmentDb.deleteEquipment(input.id);
        return { success: true };
      }),
  }),

  prioritization: router({
    listRules: isAdmin.query(async () => {
      return await prioritizationDb.getAllRules();
    }),

    createRule: isAdmin
      .input(z.object({
        name: z.string().min(1),
        ruleType: z.enum(["vip_client", "critical_equipment", "keyword", "time_elapsed"]),
        condition: z.string(), // JSON
        targetPriority: z.enum(["baixa", "media", "alta", "urgente"]),
      }))
      .mutation(async ({ input }) => {
        await prioritizationDb.createRule({ ...input, active: 1 });
        return { success: true };
      }),

    updateRule: isAdmin
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        condition: z.string().optional(),
        targetPriority: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
        active: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await prioritizationDb.updateRule(id, data);
        return { success: true };
      }),

    deleteRule: isAdmin
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await prioritizationDb.deleteRule(input.id);
        return { success: true };
      }),

    getPriorityChanges: isAuthenticated
      .input(z.object({ ticketId: z.number() }))
      .query(async ({ input }) => {
        return await prioritizationDb.getPriorityChangesByTicket(input.ticketId);
      }),
  }),

  customRoles: router({
    list: isAdmin.query(async () => {
      return await customRolesDb.getAllCustomRoles(false); // Apenas roles personalizados
    }),

    listAll: isAdmin.query(async () => {
      return await customRolesDb.getAllCustomRoles(true); // Todos os roles incluindo sistema
    }),

    listForSelect: isAuthenticated.query(async () => {
      return await customRolesDb.getAllRolesForSelect();
    }),

    getPermissions: isAdmin.query(async () => {
      return customRolesDb.AVAILABLE_PERMISSIONS;
    }),

    create: isAdmin
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        permissions: z.array(z.string()),
      }))
      .mutation(async ({ input, ctx }) => {
        await customRolesDb.createCustomRole({
          ...input,
          createdById: ctx.user.id,
        });
        return { success: true };
      }),

    update: isAdmin
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        permissions: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await customRolesDb.updateCustomRole(id, data);
        return { success: true };
      }),

    delete: isAdmin
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await customRolesDb.deleteCustomRole(input.id);
        return { success: true };
      }),
  }),

  responseTemplates: router({
    list: isAuthenticated.query(async () => {
      return await responseTemplatesDb.getAllTemplates();
    }),

    create: isAuthenticated
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        category: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await responseTemplatesDb.createTemplate({
          ...input,
          createdById: ctx.user.id,
        });
        return { success: true };
      }),

    update: isAuthenticated
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await responseTemplatesDb.updateTemplate(id, data);
        return { success: true };
      }),

    delete: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await responseTemplatesDb.deleteTemplate(input.id);
        return { success: true };
      }),

    seedDefaults: isAdmin
      .mutation(async ({ ctx }) => {
        await responseTemplatesDb.seedDefaultTemplates(ctx.user.id);
        return { success: true };
      }),
  }),

  // ===== GESTÃO INTERNA =====

  internalNews: router({
    list: isAuthenticated
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return await internalManagementDb.getAllNews(input.limit, input.offset);
      }),

    getById: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await internalManagementDb.getNewsById(input.id);
      }),

    create: isAdmin
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await internalManagementDb.createNews({
          ...input,
          authorId: ctx.user.id,
        });
        return { id };
      }),

    update: isAdmin
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await internalManagementDb.updateNews(id, data);
        return { success: true };
      }),

    delete: isAdmin
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await internalManagementDb.deleteNews(input.id);
        return { success: true };
      }),
  }),

  quickAccess: router({
    list: isAuthenticated.query(async () => {
      return await internalManagementDb.getAllQuickAccess();
    }),

    create: isAdmin
      .input(z.object({
        name: z.string().min(1),
        url: z.string().url(),
        icon: z.string().min(1),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await internalManagementDb.createQuickAccess({
          ...input,
          createdById: ctx.user.id,
        });
        return { id };
      }),

    update: isAdmin
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        url: z.string().url().optional(),
        icon: z.string().min(1).optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await internalManagementDb.updateQuickAccess(id, data);
        return { success: true };
      }),

    delete: isAdmin
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await internalManagementDb.deleteQuickAccess(input.id);
        return { success: true };
      }),
  }),

  announcements: router({
    list: isAuthenticated
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return await internalManagementDb.getAllAnnouncements(input.limit, input.offset);
      }),

    create: isAdmin
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        priority: z.enum(["baixa", "normal", "alta", "urgente"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await internalManagementDb.createAnnouncement({
          ...input,
          authorId: ctx.user.id,
        });

        // Se for urgente, notificar todos os utilizadores
        if (input.priority === "urgente") {
          const allUsers = await db.getAllUsers();
          const userIds = allUsers.map(u => u.id);
          await notificationHelpers.notifyUrgentAnnouncement(id, input.title, userIds);
        }

        return { id };
      }),

    update: isAdmin
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        priority: z.enum(["baixa", "normal", "alta", "urgente"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await internalManagementDb.updateAnnouncement(id, data);
        return { success: true };
      }),

    delete: isAdmin
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await internalManagementDb.deleteAnnouncement(input.id);
        return { success: true };
      }),
  }),

  bulletinMessages: router({
    list: isAuthenticated
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return await internalManagementDb.getAllBulletinMessages(input.limit, input.offset);
      }),

    create: isAuthenticated
      .input(z.object({ message: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const id = await internalManagementDb.createBulletinMessage({
          ...input,
          authorId: ctx.user.id,
        });
        return { id };
      }),

    delete: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se é o autor ou admin
        const messages = await internalManagementDb.getAllBulletinMessages(1000, 0);
        const message = messages.find(m => m.id === input.id);
        if (!message || (message.authorId !== ctx.user.id && ctx.user.role !== "admin")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para eliminar esta mensagem" });
        }
        await internalManagementDb.deleteBulletinMessage(input.id);
        return { success: true };
      }),

    like: isAuthenticated
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await internalManagementDb.likeBulletinMessage(input.messageId, ctx.user.id);
      }),

    hasLiked: isAuthenticated
      .input(z.object({ messageId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await internalManagementDb.hasUserLikedMessage(input.messageId, ctx.user.id);
      }),
  }),

  documentCategories: router({
    list: isAuthenticated.query(async () => {
      return await internalManagementDb.getAllDocumentCategories();
    }),

    create: isAdmin
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const id = await internalManagementDb.createDocumentCategory(input);
        return { id };
      }),

    update: isAdmin
      .input(z.object({
        id: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await internalManagementDb.updateDocumentCategory(input);
        return { success: true };
      }),

    delete: isAdmin
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await internalManagementDb.deleteDocumentCategory(input.id);
        return { success: true };
      }),
  }),

  documents: router({
    list: isAuthenticated
      .input(z.object({ categoryId: z.number().optional() }))
      .query(async ({ input }) => {
        return await internalManagementDb.getAllDocuments(input.categoryId);
      }),

    search: isAuthenticated
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await internalManagementDb.searchDocuments(input.searchTerm);
      }),

    upload: isAdmin
      .input(z.object({
        name: z.string().min(1),
        categoryId: z.number(),
        fileData: z.string(), // Base64
        mimeType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Converter base64 para buffer
        const buffer = Buffer.from(input.fileData, "base64");
        const fileSize = buffer.length;

        // Upload para S3
        const fileKey = `documents/${Date.now()}-${input.name}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Guardar na BD
        const id = await internalManagementDb.createDocument({
          name: input.name,
          categoryId: input.categoryId,
          fileKey,
          fileUrl: url,
          fileSize,
          mimeType: input.mimeType,
          uploadedById: ctx.user.id,
        });

        return { id, url };
      }),

    incrementDownload: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await internalManagementDb.incrementDocumentDownload(input.id);
        return { success: true };
      }),

    delete: isAdmin
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await internalManagementDb.deleteDocument(input.id);
        return { success: true };
      }),
  }),

  knowledgeCategories: router({
    list: isAuthenticated.query(async () => {
      return await internalManagementDb.getAllKnowledgeCategories();
    }),

    create: isAdmin
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().min(1),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await internalManagementDb.createKnowledgeCategory(input);
        return { id };
      }),

    update: isAdmin
      .input(z.object({
        id: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await internalManagementDb.updateKnowledgeCategory(input);
        return { success: true };
      }),

    delete: isAdmin
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await internalManagementDb.deleteKnowledgeCategory(input.id);
        return { success: true };
      }),
  }),

  knowledgeArticles: router({
    list: isAuthenticated
      .input(z.object({ categoryId: z.number().optional() }))
      .query(async ({ input }) => {
        return await internalManagementDb.getAllKnowledgeArticles(input.categoryId);
      }),

    getById: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const article = await internalManagementDb.getKnowledgeArticleById(input.id);
        if (!article) throw new Error("Artigo não encontrado");
        
        // Incrementar contador de visualizações
        await internalManagementDb.incrementArticleView(input.id);
        
        return article;
      }),

    searchArticles: isAuthenticated
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await internalManagementDb.searchKnowledgeArticles(input.searchTerm);
      }),

    advancedSearch: isAuthenticated
      .input(z.object({
        searchTerm: z.string().optional(),
        categoryId: z.number().optional(),
        tags: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        sortBy: z.enum(["recent", "oldest", "views", "comments"]).optional(),
      }))
      .query(async ({ input }) => {
        return await internalManagementDb.advancedSearchKnowledgeArticles(input);
      }),

    create: isAdmin
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        categoryId: z.number(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await internalManagementDb.createKnowledgeArticle({
          ...input,
          authorId: ctx.user.id,
        });
        return { id };
      }),

    update: isAdmin
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        categoryId: z.number().optional(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await internalManagementDb.updateKnowledgeArticle(id, data);
        return { success: true };
      }),

    incrementView: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await internalManagementDb.incrementArticleView(input.id);
        return { success: true };
      }),

    delete: isAdmin
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await internalManagementDb.deleteKnowledgeArticle(input.id);
        return { success: true };
      }),
  }),

  internalManagementSeed: router({
    seedAll: isAdmin.mutation(async ({ ctx }) => {
      const { seedInternalManagement } = await import("./seedInternalManagement");
      await seedInternalManagement(ctx.user.id);
      return { success: true };
    }),
  }),

  favorites: router({
    add: isAuthenticated
      .input(z.object({
        itemType: z.enum(["article", "document"]),
        itemId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await favoritesDb.addFavorite(ctx.user.id, input.itemType, input.itemId);
        return { id };
      }),

    remove: isAuthenticated
      .input(z.object({
        itemType: z.enum(["article", "document"]),
        itemId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        await favoritesDb.removeFavorite(ctx.user.id, input.itemType, input.itemId);
        return { success: true };
      }),

    check: isAuthenticated
      .input(z.object({
        itemType: z.enum(["article", "document"]),
        itemId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const isFav = await favoritesDb.isFavorite(ctx.user.id, input.itemType, input.itemId);
        return { isFavorite: isFav };
      }),

    list: isAuthenticated.query(async ({ ctx }) => {
      return await favoritesDb.getUserFavorites(ctx.user.id);
    }),
  }),

  internalManagementAnalytics: router({
    topArticles: isAdmin
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await internalManagementAnalyticsDb.getTopViewedArticles(input.limit);
      }),

    topDocuments: isAdmin
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await internalManagementAnalyticsDb.getTopDownloadedDocuments(input.limit);
      }),

    stats: isAdmin.query(async () => {
      return await internalManagementAnalyticsDb.getInternalManagementStats();
    }),

    recentArticles: isAdmin
      .input(z.object({ days: z.number().optional() }))
      .query(async ({ input }) => {
        return await internalManagementAnalyticsDb.getRecentArticles(input.days);
      }),

    recentDocuments: isAdmin
      .input(z.object({ days: z.number().optional() }))
      .query(async ({ input }) => {
        return await internalManagementAnalyticsDb.getRecentDocuments(input.days);
      }),
  }),

  articleComments: router({
    create: isAuthenticated
      .input(z.object({
        articleId: z.number(),
        comment: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await articleCommentsDb.createComment(input.articleId, ctx.user.id, input.comment);
        
        // Obter informações do artigo
        const article = await internalManagementDb.getKnowledgeArticleById(input.articleId);
        if (article) {
          // Notificar o autor do artigo
          await notificationHelpers.notifyArticleComment(
            input.articleId,
            article.title,
            article.authorId,
            ctx.user.id,
            ctx.user.name
          );

          // Obter participantes da discussão e notificá-los
          const participants = await articleCommentsDb.getArticleParticipants(input.articleId);
          // Remover o autor do artigo da lista de participantes (já foi notificado)
          const participantsToNotify = participants.filter(p => p !== article.authorId);
          
          if (participantsToNotify.length > 0) {
            await notificationHelpers.notifyArticleCommentParticipants(
              input.articleId,
              article.title,
              participantsToNotify,
              ctx.user.id,
              ctx.user.name
            );
          }
        }
        
        return { id };
      }),

    list: isAuthenticated
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input }) => {
        return await articleCommentsDb.getArticleComments(input.articleId);
      }),

    delete: isAuthenticated
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const comment = await articleCommentsDb.getCommentById(input.commentId);
        if (!comment) throw new Error("Comentário não encontrado");
        
        // Apenas o autor ou admin pode eliminar
        if (comment.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("Sem permissão para eliminar este comentário");
        }

        await articleCommentsDb.deleteComment(input.commentId);
        return { success: true };
      }),
  }),

  articleReads: router({
    markAsRead: isAuthenticated
      .input(z.object({ articleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const id = await articleReadsDb.markArticleAsRead(input.articleId, ctx.user.id);
        return { id };
      }),

    hasRead: isAuthenticated
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input, ctx }) => {
        const hasRead = await articleReadsDb.hasUserReadArticle(input.articleId, ctx.user.id);
        return { hasRead };
      }),

    getUserReadArticles: isAuthenticated.query(async ({ ctx }) => {
      const articleIds = await articleReadsDb.getUserReadArticles(ctx.user.id);
      return { articleIds };
    }),
  }),

  tags: router({
    list: isAuthenticated.query(async () => {
      return await tagsDb.getAllTags();
    }),

    create: isAdmin
      .input(z.object({
        name: z.string().min(1).max(50),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      }))
      .mutation(async ({ input }) => {
        await tagsDb.createTag(input);
        return { success: true };
      }),

    update: isAdmin
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(50).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await tagsDb.updateTag(id, data);
        return { success: true };
      }),

    delete: isAdmin
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await tagsDb.deleteTag(input.id);
        return { success: true };
      }),

    getArticleTags: isAuthenticated
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input }) => {
        return await tagsDb.getArticleTags(input.articleId);
      }),

    setArticleTags: isAdmin
      .input(z.object({
        articleId: z.number(),
        tagIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        await tagsDb.setArticleTags(input.articleId, input.tagIds);
        return { success: true };
      }),

    getArticlesByTag: isAuthenticated
      .input(z.object({ tagId: z.number() }))
      .query(async ({ input }) => {
        const articleIds = await tagsDb.getArticlesByTag(input.tagId);
        return { articleIds };
      }),

    getArticlesByTags: isAuthenticated
      .input(z.object({ tagIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        const articleIds = await tagsDb.getArticlesByTags(input.tagIds);
        return { articleIds };
      }),
  }),

  // CRM - Gestão de Leads
  crmLeads: router({  
    list: isAuthenticated
      .input(
        z.object({
          status: z.string().optional(),
          assignedToId: z.number().optional(),
          source: z.string().optional(),
          search: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await crmLeadsDb.getAllLeads(input);
      }),

    getById: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await crmLeadsDb.getLeadById(input.id);
      }),

    create: isAuthenticated
      .input(
        z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
          company: z.string().optional(),
          position: z.string().optional(),
          source: z.string(),
          status: z.enum(["novo", "contactado", "qualificado", "nao_qualificado", "convertido"]),
          score: z.number().optional(),
          assignedToId: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const leadId = await crmLeadsDb.createLead(input as any);
        // Trigger workflow para novo lead
        try {
          await crmWorkflowsDb.executeWorkflows("new_lead", {
            leadId,
            source: input.source,
            assignedToId: input.assignedToId,
          });
        } catch (e) { /* workflow errors should not block */ }
        return { id: leadId };
      }),

    update: isAuthenticated
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
          position: z.string().optional(),
          source: z.string().optional(),
          status: z.enum(["novo", "contactado", "qualificado", "nao_qualificado", "convertido"]).optional(),
          score: z.number().optional(),
          assignedToId: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Detetar mudança de status para trigger
        let oldLead: any = null;
        if (data.status) {
          oldLead = await crmLeadsDb.getLeadById(id);
        }
        await crmLeadsDb.updateLead(id, data);
        // Trigger workflow se o status mudou
        if (data.status && oldLead && oldLead.status !== data.status) {
          try {
            await crmWorkflowsDb.executeWorkflows("lead_status_change", {
              leadId: id,
              fromStatus: oldLead.status,
              toStatus: data.status,
              assignedToId: oldLead.assignedToId,
            });
          } catch (e) { /* workflow errors should not block */ }
        }
        return { success: true };
      }),

    delete: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await crmLeadsDb.deleteLead(input.id);
        return { success: true };
      }),

    updateScore: isAuthenticated
      .input(z.object({ id: z.number(), score: z.number() }))
      .mutation(async ({ input }) => {
        await crmLeadsDb.updateLeadScore(input.id, input.score);
        return { success: true };
      }),

    updateLastContacted: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await crmLeadsDb.updateLastContacted(input.id);
        return { success: true };
      }),

    assign: isAuthenticated
      .input(z.object({ id: z.number(), assignedToId: z.number() }))
      .mutation(async ({ input }) => {
        await crmLeadsDb.assignLead(input.id, input.assignedToId);
        return { success: true };
      }),

    getStats: isAuthenticated.query(async () => {
      return await crmLeadsDb.getLeadsStats();
    }),

    convertToOpportunity: isAuthenticated
      .input(z.object({ 
        leadId: z.number(), 
        opportunityData: z.object({
          title: z.string(),
          description: z.string().optional(),
          value: z.number(),
          probability: z.number().min(0).max(100),
        })
      }))
      .mutation(async ({ input, ctx }) => {
        // Create opportunity from lead data
        const lead = await crmLeadsDb.getLeadById(input.leadId);
        if (!lead) throw new Error("Lead not found");
        
        const opportunityId = await crmOpportunitiesDb.createOpportunity({
          title: input.opportunityData.title,
          description: input.opportunityData.description || "",
          value: input.opportunityData.value.toString(),
          probability: input.opportunityData.probability,
          stage: "prospeccao",
          status: "aberta",
          leadId: lead.id,
          assignedToId: ctx.user.id,
          expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        });
        
        // Mark lead as converted
        await crmLeadsDb.convertLeadToOpportunity(input.leadId, opportunityId);
        return { success: true, opportunityId };
      }),

    convertToClient: isAuthenticated
      .input(
        z.object({
          leadId: z.number(),
          clientData: z.object({
            designation: z.string(),
            address: z.string().optional(),
            primaryEmail: z.string().email(),
            nif: z.string(),
            responsiblePerson: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        const clientId = await crmLeadsDb.convertLeadToClient(input.leadId, input.clientData);
        return { success: true, clientId };
      }),
  }),

  // CRM - Gestão de Oportunidades
  crmOpportunities: router({
    list: isAuthenticated
      .input(
        z.object({
          stage: z.string().optional(),
          assignedToId: z.number().optional(),
          clientId: z.number().optional(),
          search: z.string().optional(),
          minValue: z.number().optional(),
          maxValue: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await crmOpportunitiesDb.getAllOpportunities(input);
      }),

    getById: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await crmOpportunitiesDb.getOpportunityById(input.id);
      }),

    create: isAuthenticated
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          leadId: z.number().optional(),
          clientId: z.number().optional(),
          value: z.number(),
          probability: z.number().min(0).max(100).optional(),
          stage: z.enum(["prospeccao", "qualificacao", "proposta", "negociacao", "fechamento"]).optional(),
          assignedToId: z.number(),
          expectedCloseDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const opportunityId = await crmOpportunitiesDb.createOpportunity(input as any);
        return { id: opportunityId };
      }),

    update: isAuthenticated
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          value: z.number().optional(),
          probability: z.number().min(0).max(100).optional(),
          stage: z.enum(["prospeccao", "qualificacao", "proposta", "negociacao", "fechamento"]).optional(),
          assignedToId: z.number().optional(),
          expectedCloseDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { id, value, expectedCloseDate, ...data } = input;
        // Obter oportunidade antes da atualização para detetar mudança de fase
        let oldOpp: any = null;
        if (data.stage) {
          oldOpp = await crmOpportunitiesDb.getOpportunityById(id);
        }
        await crmOpportunitiesDb.updateOpportunity(id, { 
          ...data, 
          value: value?.toString(), 
          expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined 
        });
        // Trigger workflow se a fase mudou
        if (data.stage && oldOpp && oldOpp.stage !== data.stage) {
          try {
            await crmWorkflowsDb.executeWorkflows("opportunity_stage_change", {
              opportunityId: id,
              fromStage: oldOpp.stage,
              toStage: data.stage,
              assignedToId: oldOpp.assignedToId,
              leadId: oldOpp.leadId,
              clientId: oldOpp.clientId,
            });
          } catch (e) { /* workflow errors should not block the update */ }
        }
        return { success: true };
      }),

    delete: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await crmOpportunitiesDb.deleteOpportunity(input.id);
        return { success: true };
      }),

    moveStage: isAuthenticated
      .input(z.object({ id: z.number(), newStage: z.string(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        // Obter oportunidade antes para o trigger
        const oldOpp = await crmOpportunitiesDb.getOpportunityById(input.id);
        await crmOpportunitiesDb.moveOpportunityStage(input.id, input.newStage, input.notes);
        // Trigger workflow
        if (oldOpp && oldOpp.stage !== input.newStage) {
          try {
            await crmWorkflowsDb.executeWorkflows("opportunity_stage_change", {
              opportunityId: input.id,
              fromStage: oldOpp.stage,
              toStage: input.newStage,
              assignedToId: oldOpp.assignedToId,
              leadId: oldOpp.leadId,
              clientId: oldOpp.clientId,
            });
          } catch (e) { /* workflow errors should not block */ }
        }
        return { success: true };
      }),

    assign: isAuthenticated
      .input(z.object({ id: z.number(), assignedToId: z.number() }))
      .mutation(async ({ input }) => {
        await crmOpportunitiesDb.assignOpportunity(input.id, input.assignedToId);
        return { success: true };
      }),

    getHistory: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await crmOpportunitiesDb.getOpportunityHistory(input.id);
      }),

    getStats: isAuthenticated.query(async () => {
      return await crmOpportunitiesDb.getOpportunitiesStats();
    }),

    getConversionRate: isAuthenticated.query(async () => {
      return await crmOpportunitiesDb.getConversionRate();
    }),

    convertToClient: isAuthenticated
      .input(
        z.object({
          opportunityId: z.number(),
          clientData: z.object({
            designation: z.string(),
            address: z.string().optional(),
            primaryEmail: z.string().email(),
            nif: z.string(),
            responsiblePerson: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        const clientId = await crmOpportunitiesDb.convertOpportunityToClient(
          input.opportunityId,
          input.clientData
        );
        return { success: true, clientId };
      }),

    markAsLost: isAuthenticated
      .input(z.object({ id: z.number(), lostReason: z.string().optional() }))
      .mutation(async ({ input }) => {
        await crmOpportunitiesDb.markOpportunityAsLost(input.id, input.lostReason);
        return { success: true };
      }),
  }),

  // CRM Activities Router
  crmActivities: router({
    listByLead: isAuthenticated
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return await crmActivitiesDb.getActivitiesByLead(input.leadId);
      }),

    listByOpportunity: isAuthenticated
      .input(z.object({ opportunityId: z.number() }))
      .query(async ({ input }) => {
        return await crmActivitiesDb.getActivitiesByOpportunity(input.opportunityId);
      }),

    listByClient: isAuthenticated
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await crmActivitiesDb.getActivitiesByClient(input.clientId);
      }),

    getById: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await crmActivitiesDb.getActivityById(input.id);
      }),

    create: isAuthenticated
      .input(
        z.object({
          type: z.enum(["chamada", "email", "reuniao", "nota", "tarefa_concluida"]),
          leadId: z.number().optional(),
          opportunityId: z.number().optional(),
          clientId: z.number().optional(),
          subject: z.string(),
          description: z.string().optional(),
          activityDate: z.string(),
          duration: z.number().optional(),
          outcome: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = await crmActivitiesDb.createActivity({
          ...input,
          activityDate: new Date(input.activityDate),
          userId: ctx.user.id,
        });
        return { success: true, id };
      }),

    update: isAuthenticated
      .input(
        z.object({
          id: z.number(),
          subject: z.string().optional(),
          description: z.string().optional(),
          activityDate: z.string().optional(),
          duration: z.number().optional(),
          outcome: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updated = await crmActivitiesDb.updateActivity(id, {
          ...data,
          activityDate: data.activityDate ? new Date(data.activityDate) : undefined,
        });
        return { success: true, activity: updated };
      }),

    delete: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await crmActivitiesDb.deleteActivity(input.id);
        return { success: true };
      }),

    getRecent: isAuthenticated
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await crmActivitiesDb.getRecentActivities(input.limit);
      }),

    listByUser: isAuthenticated
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await crmActivitiesDb.getActivitiesByUser(input.userId);
      }),
  }),

  // CRM Tasks Router
  crmTasks: router({
    list: isAuthenticated
      .input(
        z.object({
          status: z.string().optional(),
          priority: z.string().optional(),
          type: z.string().optional(),
          assignedToId: z.number().optional(),
          leadId: z.number().optional(),
          opportunityId: z.number().optional(),
          clientId: z.number().optional(),
          dueDateFrom: z.string().optional(),
          dueDateTo: z.string().optional(),
          overdue: z.boolean().optional(),
        })
      )
      .query(async ({ input }) => {
        return await crmTasksDb.getAllTasks({
          ...input,
          dueDateFrom: input.dueDateFrom ? new Date(input.dueDateFrom) : undefined,
          dueDateTo: input.dueDateTo ? new Date(input.dueDateTo) : undefined,
        });
      }),

    getById: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await crmTasksDb.getTaskById(input.id);
      }),

    create: isAuthenticated
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          type: z.enum(["chamada", "email", "reuniao", "follow_up", "outro"]),
          leadId: z.number().optional(),
          opportunityId: z.number().optional(),
          clientId: z.number().optional(),
          assignedToId: z.number(),
          status: z.enum(["pendente", "em_progresso", "concluida", "cancelada"]).optional(),
          priority: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
          dueDate: z.string(),
          reminderMinutes: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await crmTasksDb.createTask({
          ...input,
          dueDate: new Date(input.dueDate),
        });
        return { success: true, id };
      }),

    update: isAuthenticated
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          type: z.enum(["chamada", "email", "reuniao", "follow_up", "outro"]).optional(),
          assignedToId: z.number().optional(),
          status: z.enum(["pendente", "em_progresso", "concluida", "cancelada"]).optional(),
          priority: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
          dueDate: z.string().optional(),
          reminderMinutes: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updated = await crmTasksDb.updateTask(id, {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        });
        return { success: true, task: updated };
      }),

    complete: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const updated = await crmTasksDb.completeTask(input.id);
        return { success: true, task: updated };
      }),

    delete: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await crmTasksDb.deleteTask(input.id);
        return { success: true };
      }),

    listByLead: isAuthenticated
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return await crmTasksDb.getTasksByLead(input.leadId);
      }),

    listByOpportunity: isAuthenticated
      .input(z.object({ opportunityId: z.number() }))
      .query(async ({ input }) => {
        return await crmTasksDb.getTasksByOpportunity(input.opportunityId);
      }),

    listByClient: isAuthenticated
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await crmTasksDb.getTasksByClient(input.clientId);
      }),

    listByUser: isAuthenticated
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await crmTasksDb.getTasksByUser(input.userId);
      }),

    getOverdue: isAuthenticated
      .query(async () => {
        return await crmTasksDb.getOverdueTasks();
      }),

    getStats: isAuthenticated
      .query(async () => {
        return await crmTasksDb.getTaskStats();
      }),
  }),

  // CRM Tasks Reports Router
  crmTasksReports: router({
    getMetrics: isAuthenticated
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await crmTasksReports.getTaskMetrics(
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),

    getByType: isAuthenticated
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await crmTasksReports.getTasksByType(
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),

    getByPriority: isAuthenticated
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await crmTasksReports.getTasksByPriority(
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),

    getUserProductivity: isAuthenticated
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await crmTasksReports.getUserProductivity(
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),

    getCompletionTimeline: isAuthenticated
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await crmTasksReports.getCompletionTimeline(
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),

    getAvgCompletionTime: isAuthenticated
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await crmTasksReports.getAvgCompletionTime(
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),
  }),

  // Personal Tasks Dashboard
  crmTasksPersonal: router({
    getStats: isAuthenticated.query(async ({ ctx }) => {
      return await crmTasksPersonal.getPersonalTaskStats(ctx.user.id);
    }),

    getTodayTasks: isAuthenticated.query(async ({ ctx }) => {
      return await crmTasksPersonal.getTodayTasks(ctx.user.id);
    }),

    getUpcomingTasks: isAuthenticated
      .input(z.object({ days: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await crmTasksPersonal.getUpcomingTasks(ctx.user.id, input.days);
      }),

    getProductivityTimeline: isAuthenticated.query(async ({ ctx }) => {
      return await crmTasksPersonal.getPersonalProductivityTimeline(ctx.user.id);
    }),

    getTasksByPriority: isAuthenticated.query(async ({ ctx }) => {
      return await crmTasksPersonal.getPersonalTasksByPriority(ctx.user.id);
    }),

    getTasksByType: isAuthenticated.query(async ({ ctx }) => {
      return await crmTasksPersonal.getPersonalTasksByType(ctx.user.id);
    }),

    getHighPriorityTasks: isAuthenticated.query(async ({ ctx }) => {
      return await crmTasksPersonal.getHighPriorityTasks(ctx.user.id);
    }),
  }),

  // CRM Campaigns
  crmCampaigns: router({
    list: isAuthenticated
      .input(
        z.object({
          type: z.string().optional(),
          status: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await crmCampaignsDb.listCampaigns(input);
      }),

    getById: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await crmCampaignsDb.getCampaignById(input.id);
      }),

    create: isAuthenticated
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          type: z.enum(["email", "newsletter", "evento", "webinar", "outro"]),
          subject: z.string().optional(),
          emailContent: z.string().optional(),
          templateId: z.number().optional(),
          scheduledAt: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const campaignId = await crmCampaignsDb.createCampaign({
          ...input,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
          createdById: ctx.user.id,
        });
        return { id: campaignId };
      }),

    update: isAuthenticated
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          type: z.enum(["email", "newsletter", "evento", "webinar", "outro"]).optional(),
          status: z.enum(["rascunho", "agendada", "em_envio", "enviada", "cancelada"]).optional(),
          subject: z.string().optional(),
          emailContent: z.string().optional(),
          templateId: z.number().nullable().optional(),
          scheduledAt: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await crmCampaignsDb.updateCampaign(id, {
          ...data,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        });
        return { success: true };
      }),

    delete: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await crmCampaignsDb.deleteCampaign(input.id);
        return { success: true };
      }),

    addContacts: isAuthenticated
      .input(
        z.object({
          campaignId: z.number(),
          contacts: z.array(
            z.object({
              leadId: z.number().optional(),
              clientId: z.number().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        await crmCampaignsDb.addContactsToCampaign(input.campaignId, input.contacts);
        return { success: true };
      }),

    getContacts: isAuthenticated
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return await crmCampaignsDb.getCampaignContacts(input.campaignId);
      }),

    getStats: isAuthenticated.query(async () => {
      return await crmCampaignsDb.getCampaignStats();
    }),

    getRecent: isAuthenticated
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await crmCampaignsDb.getRecentCampaigns(input.limit);
      }),

    markAsSent: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await crmCampaignsDb.markCampaignAsSent(input.id);
        return { success: true };
      }),
  }),

  // Lead Scoring Router
  crmLeadScoring: router({
    getRules: isAuthenticated.query(async () => {
      return crmLeadScoringDb.getScoringRules();
    }),

    updateRules: isAuthenticated
      .input(
        z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            field: z.string(),
            condition: z.enum(["equals", "not_empty", "greater_than", "contains", "activity_count", "has_opportunity"]),
            value: z.string(),
            points: z.number(),
            active: z.boolean(),
          })
        )
      )
      .mutation(async ({ input }) => {
        crmLeadScoringDb.updateScoringRules(input);
        return { success: true };
      }),

    resetRules: isAuthenticated.mutation(async () => {
      crmLeadScoringDb.resetScoringRules();
      return { success: true };
    }),

    calculateScore: isAuthenticated
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return await crmLeadScoringDb.calculateLeadScore(input.leadId);
      }),

    recalculateAll: isAuthenticated.mutation(async () => {
      return await crmLeadScoringDb.recalculateAllLeadScores();
    }),

    getDistribution: isAuthenticated.query(async () => {
      return await crmLeadScoringDb.getScoreDistribution();
    }),
  }),

  // ============================================================================
  // TEMPLATES DE EMAIL
  // ============================================================================
  crmEmailTemplates: router({
    list: isAuthenticated
      .input(z.object({ category: z.string().optional(), active: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        return await crmEmailTemplatesDb.listTemplates(input || undefined);
      }),

    getById: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await crmEmailTemplatesDb.getTemplateById(input.id);
      }),

    create: isAuthenticated
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        subject: z.string().min(1),
        htmlContent: z.string().min(1),
        variables: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await crmEmailTemplatesDb.createTemplate({
          ...input,
          createdById: ctx.user!.id,
        });
        return { id };
      }),

    update: isAuthenticated
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        subject: z.string().optional(),
        htmlContent: z.string().optional(),
        variables: z.array(z.string()).optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await crmEmailTemplatesDb.updateTemplate(id, data);
        return { success: true };
      }),

    delete: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await crmEmailTemplatesDb.deleteTemplate(input.id);
        return { success: true };
      }),

    preview: isAuthenticated
      .input(z.object({ subject: z.string(), htmlContent: z.string() }))
      .query(async ({ input }) => {
        return crmEmailTemplatesDb.previewTemplate(input.subject, input.htmlContent);
      }),

    getCategories: isAuthenticated.query(async () => {
      return await crmEmailTemplatesDb.getCategories();
    }),

    getAvailableVariables: isAuthenticated.query(async () => {
      return crmEmailTemplatesDb.AVAILABLE_VARIABLES;
    }),
  }),

  // ============================================================================
  // AUTOMAÇÃO DE WORKFLOWS
  // ============================================================================
  crmWorkflows: router({
    list: isAuthenticated
      .input(z.object({ active: z.boolean().optional(), triggerType: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await crmWorkflowsDb.listRules(input || undefined);
      }),

    getById: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await crmWorkflowsDb.getRuleById(input.id);
      }),

    create: isAuthenticated
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        triggerType: z.string(),
        conditions: z.record(z.string(), z.any()),
        actionType: z.string(),
        actionParams: z.record(z.string(), z.any()),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await crmWorkflowsDb.createRule({
          ...input,
          createdById: ctx.user!.id,
        });
        return { id };
      }),

    update: isAuthenticated
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        triggerType: z.string().optional(),
        conditions: z.record(z.string(), z.any()).optional(),
        actionType: z.string().optional(),
        actionParams: z.record(z.string(), z.any()).optional(),
        active: z.boolean().optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await crmWorkflowsDb.updateRule(id, data);
        return { success: true };
      }),

    delete: isAuthenticated
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await crmWorkflowsDb.deleteRule(input.id);
        return { success: true };
      }),

    getLogs: isAuthenticated
      .input(z.object({ ruleId: z.number().optional(), limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await crmWorkflowsDb.getExecutionLogs(input || undefined);
      }),

    getStats: isAuthenticated.query(async () => {
      return await crmWorkflowsDb.getWorkflowStats();
    }),

    getTriggerTypes: isAuthenticated.query(async () => {
      return crmWorkflowsDb.TRIGGER_TYPES;
    }),

    getActionTypes: isAuthenticated.query(async () => {
      return crmWorkflowsDb.ACTION_TYPES;
    }),

    getExecutionTimeline: isAuthenticated
      .input(z.object({ days: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await crmWorkflowsDb.getExecutionTimeline(input?.days || 30);
      }),

    getTopRules: isAuthenticated
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await crmWorkflowsDb.getTopRules(input?.limit || 10);
      }),

    getSuccessRateByAction: isAuthenticated.query(async () => {
      return await crmWorkflowsDb.getSuccessRateByAction();
    }),

    getSuccessRateByTrigger: isAuthenticated.query(async () => {
      return await crmWorkflowsDb.getSuccessRateByTrigger();
    }),
  }),

  // ============================================================================
  // DETEÇÃO DE DUPLICADOS
  // ============================================================================
  crmDuplicates: router({
    findAll: isAuthenticated.query(async () => {
      return await crmDuplicatesDb.findAllDuplicates();
    }),

    check: isAuthenticated
      .input(z.object({
        email: z.string(),
        phone: z.string().optional(),
        name: z.string().optional(),
        company: z.string().optional(),
        excludeId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await crmDuplicatesDb.checkForDuplicates(input);
      }),

    merge: isAuthenticated
      .input(z.object({
        primaryId: z.number(),
        secondaryId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await crmDuplicatesDb.mergeLeads(input.primaryId, input.secondaryId);
        return { success: true };
      }),

    getStats: isAuthenticated.query(async () => {
      return await crmDuplicatesDb.getDuplicateStats();
    }),
  }),

  systemSettings: router({
    list: isAdmin.query(async () => {
      return await systemSettingsDb.getAllSettings();
    }),

    getByCategory: isAdmin
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return await systemSettingsDb.getSettingsByCategory(input.category);
      }),

    get: isAdmin
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return await systemSettingsDb.getSetting(input.key);
      }),

    upsert: isAdmin
      .input(z.object({
        key: z.string(),
        value: z.string().nullable(),
        type: z.string().optional(),
        category: z.string().optional(),
        label: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await systemSettingsDb.upsertSetting({
          ...input,
          updatedById: ctx.user.id,
        });
      }),

    updateMultiple: isAdmin
      .input(z.object({
        settings: z.array(z.object({
          key: z.string(),
          value: z.string().nullable(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        return await systemSettingsDb.updateMultipleSettings(input.settings, ctx.user.id);
      }),

    initialize: isAdmin.mutation(async () => {
      await systemSettingsDb.initializeDefaultSettings();
      return { success: true };
    }),
  }),

  commercialClients: router({
    list: isAuthenticated
      .input(z.object({
        search: z.string().optional(),
        zone: z.string().optional(),
        salesperson: z.string().optional(),
        active: z.boolean().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await commercialClientsDb.getAllCommercialClients(input || {});
      }),
    getById: isAuthenticated
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await commercialClientsDb.getCommercialClientById(input.id);
      }),
    create: isAdmin
      .input(z.object({
        company: z.string().min(1),
        address: z.string().optional(),
        locality: z.string().optional(),
        postalCode: z.string().optional(),
        county: z.string().optional(),
        district: z.string().optional(),
        country: z.string().optional(),
        nif: z.string().optional(),
        phone1: z.string().optional(),
        phone2: z.string().optional(),
        fax: z.string().optional(),
        mobile1: z.string().optional(),
        mobile2: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        salesperson: z.string().optional(),
        zone: z.string().optional(),
        paymentTerms: z.string().optional(),
        discount: z.string().optional(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await commercialClientsDb.createCommercialClient(input);
        return { id };
      }),
    update: isAdmin
      .input(z.object({
        id: z.number(),
        company: z.string().optional(),
        address: z.string().optional(),
        locality: z.string().optional(),
        postalCode: z.string().optional(),
        county: z.string().optional(),
        district: z.string().optional(),
        country: z.string().optional(),
        nif: z.string().optional(),
        phone1: z.string().optional(),
        phone2: z.string().optional(),
        fax: z.string().optional(),
        mobile1: z.string().optional(),
        mobile2: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        salesperson: z.string().optional(),
        zone: z.string().optional(),
        paymentTerms: z.string().optional(),
        discount: z.string().optional(),
        comments: z.string().optional(),
        active: z.number().optional(),
        blocked: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await commercialClientsDb.updateCommercialClient(id, data);
        return { success: true };
      }),
    delete: isAdmin
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await commercialClientsDb.deleteCommercialClient(input.id);
        return { success: true };
      }),
    stats: isAuthenticated.query(async () => {
      return await commercialClientsDb.getCommercialClientStats();
    }),
    zones: isAuthenticated.query(async () => {
      return await commercialClientsDb.getZones();
    }),
    salespersons: isAuthenticated.query(async () => {
      return await commercialClientsDb.getSalespersons();
    }),
    import: isAdmin
      .input(z.object({
        fileBase64: z.string(),
        fileName: z.string(),
        jobId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const buffer = Buffer.from(input.fileBase64, "base64");
          const workbook = XLSX.read(buffer, { type: "buffer" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet);

          const clients = rows.map((row: any) => {
            const clean = (val: any) => {
              if (val === undefined || val === null || val === "" || val === "NaN" || Number.isNaN(val)) return null;
              return String(val).trim();
            };
            const cleanDate = (val: any) => {
              if (!val) return null;
              try {
                if (typeof val === "number") {
                  // Excel date serial number
                  const date = XLSX.SSF.parse_date_code(val);
                  return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
                }
                const d = new Date(val);
                if (isNaN(d.getTime())) return null;
                return d.toISOString().split("T")[0];
              } catch { return null; }
            };

            return {
              externalId: row["N_"] ? Number(row["N_"]) : null,
              company: clean(row["Empresa"]) || "Sem Nome",
              address: clean(row["Morada"]),
              locality: clean(row["Localidade"]),
              postalCode: clean(row["C_ Postal"]),
              county: clean(row["Concelho"]),
              district: clean(row["Distrito"]),
              country: clean(row["Pais"]) || "Portugal",
              nif: clean(row["Contribuinte"]),
              phone1: clean(row["Telefone _1_"]),
              phone2: clean(row["Telefone _2_"]),
              fax: clean(row["Fax"]),
              mobile1: clean(row["Telemovel _1_"]),
              mobile2: clean(row["Telemovel _2_"]),
              email: clean(row["Email"]),
              website: clean(row["Site"]),
              salesperson: clean(row["Vendedor"]),
              zone: clean(row["Zona"]),
              paymentTerms: clean(row["Pagamento"]),
              discount: row["Desconto Directo"] ? String(row["Desconto Directo"]) : "0",
              balance: row["Saldo"] !== undefined && row["Saldo"] !== null && !isNaN(Number(row["Saldo"])) ? String(row["Saldo"]) : null,
              active: row["Activo"] === true || row["Activo"] === "True" || row["Activo"] === 1 ? 1 : 0,
              blocked: row["Bloqueado"] === true || row["Bloqueado"] === "True" || row["Bloqueado"] === 1 ? 1 : 0,
              clientSince: cleanDate(row["Cliente desde"]),
              comments: clean(row["Comentarios"]),
            };
          });

          // Obter o mapa de clientes SSE para enviar progresso (seguro em testes)
          const app = ctx.req?.app;
          const progressClients = app ? (app as any).__importProgressClients as Map<string, any> | undefined : undefined;
          const sseRes = progressClients?.get(input.jobId);

          // Enviar total inicial
          if (sseRes) {
            sseRes.write(`data: ${JSON.stringify({ type: "start", total: clients.length })}\n\n`);
          }

          const result = await commercialClientsDb.importCommercialClients(clients as any, (progress) => {
            if (sseRes) {
              sseRes.write(`data: ${JSON.stringify({ type: "progress", ...progress })}\n\n`);
            }
          });

          // Enviar resultado final via SSE
          if (sseRes) {
            sseRes.write(`data: ${JSON.stringify({ type: "complete", ...result, errors: result.errors.length })}\n\n`);
            sseRes.end();
            progressClients?.delete(input.jobId);
          }

          return result;
        } catch (err: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Erro ao processar ficheiro Excel: ${err.message}`,
          });
        }
      }),
  }),
});
export type AppRouter = typeof appRouter;
