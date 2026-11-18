import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  CLIENT_URL: z.string().default('https://cine-omega-peach.vercel.app'),
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
  BREVO_API_KEY: z.string().optional().default(''),
  BREVO_SENDER_EMAIL: z.string().optional().default('no-reply@cineticket.com'),
  BREVO_SENDER_NAME: z.string().optional().default('CineTicket'),
  TMDB_API_KEY: z.string().optional().default(''),
  SEAT_HOLD_MINUTES: z.string().default('8').transform((val) => parseInt(val, 10)),
  CONVENIENCE_FEE_PERCENT: z.string().default('0').transform((val) => parseFloat(val))
});

let parsedEnv;

try {
  parsedEnv = envSchema.parse(process.env);
  if (!parsedEnv.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    console.warn('[SECURITY WARNING] RAZORPAY_KEY_ID does not have the "rzp_test_" prefix. Test mode key expected.');
  }
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('[FATAL] Environment variable validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    console.error('[FATAL] Failed to parse environment variables:', error);
  }
  process.exit(1);
}

export const env = parsedEnv;
