import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  clientId: z.number().int().positive()
});
