import { env } from '../config/env.js';
import { generateBookingConfirmationEmail } from '../emailTemplates/bookingConfirmation.js';
import { generateBookingCancellationEmail } from '../emailTemplates/bookingCancellation.js';

export const emailService = {
  async sendEmail({ to, subject, htmlContent, textContent }) {
    if (!env.BREVO_API_KEY) {
      console.warn('[EMAIL WARNING] BREVO_API_KEY is not configured. Email suppressed.');
      return { success: false, reason: 'NOT_CONFIGURED' };
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: env.BREVO_SENDER_NAME,
            email: env.BREVO_SENDER_EMAIL
          },
          to: [{ email: to }],
          subject,
          htmlContent,
          textContent
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[BREVO API ERROR]', response.status, errorBody);
        return { success: false, error: errorBody };
      }

      const data = await response.json();
      return { success: true, messageId: data.messageId };
    } catch (error) {
      console.error('[EMAIL DISPATCH ERROR]', error);
      return { success: false, error: error.message };
    }
  },

  async sendBookingConfirmation({ to, bookingData }) {
    const { html, text } = generateBookingConfirmationEmail({
      ...bookingData,
      myBookingsUrl: `${env.CLIENT_URL}/my-bookings`
    });

    return await this.sendEmail({
      to,
      subject: `Booking Confirmed: ${bookingData.movieTitle} - ${bookingData.bookingCode}`,
      htmlContent: html,
      textContent: text
    });
  },

  async sendBookingCancellation({ to, cancellationData }) {
    const { html, text } = generateBookingCancellationEmail({
      ...cancellationData,
      myBookingsUrl: `${env.CLIENT_URL}/my-bookings`
    });

    return await this.sendEmail({
      to,
      subject: `Booking Cancelled: ${cancellationData.bookingCode}`,
      htmlContent: html,
      textContent: text
    });
  }
};
