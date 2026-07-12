import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_URL: z.string().url(),
  APP_SECRET: z.string().min(8),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  LOGIN_TRUSTED_PROXY_SECRET: z.string().min(16).optional().default(''),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().email(),
  UPLOADS_PATH: z.string().min(1),
});

export function getEnv() {
  return envSchema.parse(process.env);
}
