import { z } from "zod";

export const contactSchema = z.object({
  profile: z.object({ name: z.string() }),
  wa_id: z.string(),
});
