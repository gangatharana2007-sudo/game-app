import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(3000),
  GEMINI_API_KEY: z.string().optional(),
  APP_URL: z.string().url().optional().or(z.literal('')),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().positive().default(120),
  CORS_ALLOWED_ORIGINS: z.string().default('*'),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

let validatedEnv: ValidatedEnv;

try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('[CRITICAL] Environment variable validation failed:');
    error.issues.forEach((err) => {
      console.error(` - ${err.path.join('.')}: ${err.message}`);
    });
  }
  // Provide safe fallback defaults so non-critical development builds don't crash
  validatedEnv = {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    PORT: Number(process.env.PORT) || 3000,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    APP_URL: process.env.APP_URL || '',
    RATE_LIMIT_PER_MINUTE: 120,
    CORS_ALLOWED_ORIGINS: '*',
  };
}

export const env = validatedEnv;
