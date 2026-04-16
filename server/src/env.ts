import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16).default("change-me-change-me-change-me"),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().optional(),
  UPLOAD_DIR: z.string().default("uploads"),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(6).optional(),
  SEED_ADMIN_NAME: z.string().optional()
});

export const env = envSchema.parse(process.env);

