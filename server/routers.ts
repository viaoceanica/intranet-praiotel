import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as ticketsDb from "./ticketsDb";
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

export const appRouter = router({
  system: systemRouter,
  
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
        
        await ticketsDb.createTicket({
          ticketNumber,
          clientName: input.clientName,
          equipment: input.equipment,
          problemType: input.problemType,
          priority: input.priority,
          status: "aberto",
          location: input.location,
          description: input.description,
          assignedToId: input.assignedToId,
          createdById: ctx.user.id,
        });

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
  }),
});

export type AppRouter = typeof appRouter;
