import { z } from "zod";

export const ticketUpdateInputSchema = z.object({
  id: z.number(),
  clientName: z.string().min(1).optional(),
  equipment: z.string().min(1).optional(),
  problemType: z.string().min(1).optional(),
  priority: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
  status: z.enum(["aberto", "em_progresso", "resolvido"]).optional(),
  location: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  notes: z.string().optional(),
  assignedToId: z.number().nullable().optional(),
});
