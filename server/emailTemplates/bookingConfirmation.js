export function generateBookingConfirmationEmail({
  bookingCode,
  movieTitle,
  language,
  format,
  theatreName,
  theatreAddress,
  screenName,
  showDate,
  showTime,
  seats,
  totalAmount,
  paymentId,
  myBookingsUrl
}) {
  const seatsList = Array.isArray(seats)
    ? seats.map((s) => `${s.row_label}${s.seat_number} (${s.category})`).join(', ')
    : seats;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation - ${bookingCode}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0B10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F4F4F7;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0B0B10; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #14141C; border-radius: 12px; border: 1px solid #2A2A38; overflow: hidden; padding: 32px 24px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid #2A2A38;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #E11D48; letter-spacing: 0.5px;">CineTicket</h1>
              <p style="margin: 0; font-size: 14px; color: #22C55E; font-weight: 600;">BOOKING CONFIRMED</p>
              <p style="margin: 6px 0 0; font-size: 13px; color: #A5A5B5;">Booking Reference: <strong style="color: #F4F4F7;">${bookingCode}</strong></p>
            </td>
          </tr>

          <!-- Movie Info -->
          <tr>
            <td style="padding: 24px 0 16px;">
              <h2 style="margin: 0 0 6px; font-size: 20px; font-weight: 600; color: #F4F4F7;">${movieTitle}</h2>
              <p style="margin: 0; font-size: 14px; color: #A5A5B5;">${language} | ${format}</p>
            </td>
          </tr>

          <!-- Theatre & Show Details -->
          <tr>
            <td style="background-color: #1C1C27; border-radius: 8px; padding: 16px; margin: 12px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <p style="margin: 0; font-size: 12px; color: #A5A5B5; text-transform: uppercase;">Cinema</p>
                    <p style="margin: 2px 0 0; font-size: 14px; font-weight: 600; color: #F4F4F7;">${theatreName}</p>
                    <p style="margin: 2px 0 0; font-size: 12px; color: #A5A5B5;">${theatreAddress}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px;">
                    <p style="margin: 0; font-size: 12px; color: #A5A5B5; text-transform: uppercase;">Screen & Show Time</p>
                    <p style="margin: 2px 0 0; font-size: 14px; font-weight: 600; color: #F4F4F7;">${screenName} - ${showDate} at ${showTime} IST</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 12px; color: #A5A5B5; text-transform: uppercase;">Seats</p>
                    <p style="margin: 2px 0 0; font-size: 14px; font-weight: 600; color: #F4F4F7;">${seatsList}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Summary -->
          <tr>
            <td style="padding: 20px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 14px; color: #A5A5B5;">Amount Paid</td>
                  <td align="right" style="font-size: 16px; font-weight: 700; color: #F4F4F7;">INR ${Number(totalAmount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #6C6C7D; padding-top: 4px;">Payment ID: ${paymentId || 'N/A'}</td>
                  <td align="right" style="font-size: 12px; color: #22C55E; padding-top: 4px;">PAID</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-top: 12px;">
              <a href="${myBookingsUrl}" style="display: inline-block; background-color: #E11D48; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 6px;">View in My Bookings</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px; border-top: 1px solid #2A2A38; margin-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #6C6C7D;">Please present the booking code or download the bill at the cinema entry counter.</p>
              <p style="margin: 6px 0 0; font-size: 11px; color: #6C6C7D;">CineTicket - Automated Notification</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
CineTicket - BOOKING CONFIRMED
Booking Reference: ${bookingCode}

Movie: ${movieTitle} (${language} | ${format})
Cinema: ${theatreName}, ${theatreAddress}
Screen: ${screenName}
Date & Time: ${showDate} at ${showTime} IST
Seats: ${seatsList}

Total Paid: INR ${Number(totalAmount).toFixed(2)}
Payment ID: ${paymentId || 'N/A'}

View your booking and download the bill here:
${myBookingsUrl}
  `.trim();

  return { html, text };
}
