import { env } from './env.js';

export const brevoConfig = {
  apiKey: env.BREVO_API_KEY,
  senderEmail: env.BREVO_SENDER_EMAIL,
  senderName: env.BREVO_SENDER_NAME,
  apiUrl: 'https://api.brevo.com/v3/smtp/email'
};
