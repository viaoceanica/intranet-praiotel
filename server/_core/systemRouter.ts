import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  // Sistema de monitorização de erros
  logError: publicProcedure
    .input(
      z.object({
        message: z.string(),
        stack: z.string().optional(),
        componentStack: z.string().optional(),
        timestamp: z.string(),
        userAgent: z.string(),
        url: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Log error to console in development
      if (process.env.NODE_ENV === "development") {
        console.error("[Frontend Error]", {
          message: input.message,
          url: input.url,
          timestamp: input.timestamp,
          stack: input.stack,
        });
      }

      // Notify owner of critical errors
      if (input.message.includes("TypeError") || input.message.includes("ReferenceError")) {
        try {
          await notifyOwner({
            title: "Erro Crítico na Intranet",
            content: `Erro detectado em produção:\n\nMensagem: ${input.message}\nURL: ${input.url}\nTimestamp: ${input.timestamp}`,
          });
        } catch (err) {
          console.error("Failed to notify owner of error:", err);
        }
      }

      return { success: true };
    }),
});
