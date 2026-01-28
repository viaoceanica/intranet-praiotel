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
          clientId: input.clientId,
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
        await clientsDb.createClient(input);
        return { success: true };
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
});

export type AppRouter = typeof appRouter;
