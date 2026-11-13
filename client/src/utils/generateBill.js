import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { formatDateIST, formatTimeIST } from './format.js';

export async function generateBill(booking) {
  if (!booking) throw new Error('Booking data is required to generate bill');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // ── Palette ─────────────────────────────────────────────────────────────
  const primaryCrimson = [225, 29, 72];    // #E11D48
  const headerDark = [17, 24, 39];         // #111827
  const surfaceLight = [248, 250, 252];    // #F8FAFC
  const borderLight = [226, 232, 240];     // #E2E8F0
  const textDark = [15, 23, 42];           // #0F172A
  const textMuted = [100, 116, 139];       // #64748B
  const textLight = [255, 255, 255];
  const successGreen = [16, 185, 129];     // #10B981

  // ── Top Header Brand Bar (Dark Card) ────────────────────────────────────
  doc.setFillColor(...headerDark);
  doc.roundedRect(margin, 14, contentWidth, 28, 3, 3, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...textLight);
  doc.text('CineTicket', margin + 8, 26);

  // Tiny accent dot
  doc.setFillColor(...primaryCrimson);
  doc.circle(margin + 46, 23.5, 1.6, 'F');

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text('OFFICIAL TAX INVOICE & ADMISSION PASS', margin + 8, 34);

  // Right-side Booking Code Badge inside header
  const badgeWidth = 54;
  const badgeHeight = 16;
  const badgeX = pageWidth - margin - badgeWidth - 6;
  const badgeY = 20;

  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('BOOKING CODE', badgeX + badgeWidth / 2, badgeY + 5.5, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(booking.booking_code || 'N/A', badgeX + badgeWidth / 2, badgeY + 12.5, { align: 'center' });

  // ── Screening & Film Card ───────────────────────────────────────────────
  let currentY = 48;
  const filmCardHeight = 44;
  doc.setFillColor(...surfaceLight);
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, filmCardHeight, 3, 3, 'FD');

  // Left red accent strip
  doc.setFillColor(...primaryCrimson);
  doc.roundedRect(margin, currentY, 3, filmCardHeight, 1.5, 1.5, 'F');

  // Movie Title
  const movieTitle = booking.shows?.movie?.title || 'Feature Film';
  const language = booking.shows?.language || 'Hindi';
  const format = booking.shows?.format || '2D';
  const certificate = booking.shows?.movie?.certificate || 'UA';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...textDark);
  doc.text(movieTitle, margin + 8, currentY + 9);

  // Pills for Certificate, Language, Format
  const pillY = currentY + 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  // Cert pill
  doc.setFillColor(254, 226, 226); // Light red
  doc.setTextColor(...primaryCrimson);
  doc.roundedRect(margin + 8, pillY, 14, 5, 1.5, 1.5, 'F');
  doc.text(certificate, margin + 15, pillY + 3.6, { align: 'center' });

  // Lang & Format pill
  const formatLabel = `${language} | ${format}`;
  const formatWidth = doc.getTextWidth(formatLabel) + 6;
  doc.setFillColor(241, 245, 249);
  doc.setTextColor(...textMuted);
  doc.roundedRect(margin + 25, pillY, formatWidth, 5, 1.5, 1.5, 'F');
  doc.text(formatLabel, margin + 28, pillY + 3.6);

  // Cinema, Screen & Showtime
  const theatreName = booking.shows?.screen?.theatre?.name || 'Multiplex Cinema';
  const theatreAddress = [
    booking.shows?.screen?.theatre?.address,
    booking.shows?.screen?.theatre?.city
  ].filter(Boolean).join(', ');
  const screenName = booking.shows?.screen?.name || 'Screen 1';
  const showDate = formatDateIST(booking.shows?.starts_at);
  const showTime = formatTimeIST(booking.shows?.starts_at);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('Cinema:', margin + 8, currentY + 26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`${theatreName} (${theatreAddress})`, margin + 22, currentY + 26);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Screen:', margin + 8, currentY + 32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(screenName, margin + 22, currentY + 32);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Showtime:', margin + 8, currentY + 38);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryCrimson);
  doc.text(`${showDate} at ${showTime} IST`, margin + 25, currentY + 38);

  // Status Pill on top-right of film card
  const statusStr = booking.status === 'CONFIRMED' ? 'CONFIRMED' : booking.status || 'PENDING';
  doc.setFillColor(236, 253, 245); // Light green
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(pageWidth - margin - 32, currentY + 7, 26, 6, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...successGreen);
  doc.text(statusStr, pageWidth - margin - 19, currentY + 11.2, { align: 'center' });

  // ── Customer & Booking Meta Row ──────────────────────────────────────────
  currentY += filmCardHeight + 6;
  const metaBoxHeight = 16;
  doc.setFillColor(...surfaceLight);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(margin, currentY, contentWidth, metaBoxHeight, 2, 2, 'FD');

  const bookedAt = booking.confirmed_at || booking.created_at;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('Customer Name:', margin + 6, currentY + 6);
  doc.text('Customer Email:', margin + 6, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(booking.customerName || 'Valued Customer', margin + 30, currentY + 6);
  doc.text(booking.customerEmail || 'N/A', margin + 30, currentY + 11.5);

  // Right column of meta box
  const rightColX = pageWidth - margin - 80;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Booking Date:', rightColX, currentY + 6);
  doc.text('Payment Mode:', rightColX, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`${formatDateIST(bookedAt)} ${formatTimeIST(bookedAt)} IST`, rightColX + 22, currentY + 6);
  doc.text('Online (Razorpay Secure)', rightColX + 22, currentY + 11.5);

  // ── Reserved Seats Breakdown Table ──────────────────────────────────────
  currentY += metaBoxHeight + 8;

  let savedAttendees = [];
  try {
    const raw = localStorage.getItem(`cineticket_attendees_${booking.id}`);
    if (raw) savedAttendees = JSON.parse(raw);
  } catch {}

  const hasAttendees = savedAttendees.length > 0;
  const tableHead = hasAttendees
    ? [['#', 'Reserved Seat', 'Attending Member', 'Tier Category', 'Amount']]
    : [['#', 'Reserved Seat Label', 'Tier Category', 'Screening Slot', 'Amount']];

  const tableRows = (booking.booking_seats || []).map((bs, index) => {
    const att = savedAttendees[index];
    const memberDesc = att?.name
      ? `${att.name}${att.age ? ` (${att.age} yrs)` : ''}`
      : (booking.customerName || 'Valued Customer');

    return hasAttendees
      ? [
          String(index + 1).padStart(2, '0'),
          `Row ${bs.seat?.row_label || '—'}-${bs.seat?.seat_number || '—'}`,
          memberDesc,
          bs.seat?.category || 'Standard',
          `INR ${Number(bs.price || 0).toFixed(2)}`
        ]
      : [
          String(index + 1).padStart(2, '0'),
          `Row ${bs.seat?.row_label || '—'}, Seat ${bs.seat?.seat_number || '—'}`,
          bs.seat?.category || 'Standard',
          formatTimeIST(booking.shows?.starts_at),
          `INR ${Number(bs.price || 0).toFixed(2)}`
        ];
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 3.5
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: textDark,
      lineColor: borderLight,
      lineWidth: 0.2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { fontStyle: 'bold' },
      2: { textColor: textMuted },
      3: { textColor: textMuted },
      4: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  const tableEndY = doc.lastAutoTable.finalY + 6;

  // ── Split Bottom Section: QR Pass (Left) & Invoice Summary (Right) ─────
  const bottomBoxHeight = 58;

  // Left Box: Admission QR Pass
  const qrBoxWidth = contentWidth * 0.48;
  doc.setFillColor(...surfaceLight);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(margin, tableEndY, qrBoxWidth, bottomBoxHeight, 2.5, 2.5, 'FD');

  // Title in QR box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textDark);
  doc.text('Box Office Admission Pass', margin + 6, tableEndY + 7);

  // QR Code
  try {
    const qrDataUrl = await QRCode.toDataURL(booking.booking_code, {
      margin: 0,
      width: 140,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF'
      }
    });
    doc.addImage(qrDataUrl, 'PNG', margin + 6, tableEndY + 12, 28, 28);
  } catch (qrErr) {
    console.warn('[QR GENERATION ERROR]', qrErr);
  }

  // Text next to QR code
  const qrTextX = margin + 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text('Direct Entry QR', qrTextX, tableEndY + 17);

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryCrimson);
  doc.text(booking.booking_code || '', qrTextX, tableEndY + 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text('Scan at cinema turnstiles or box office for entry ticket.', qrTextX, tableEndY + 29, { maxWidth: qrBoxWidth - 44 });

  const paymentRecord = Array.isArray(booking.payments) ? booking.payments[0] : booking.payments;
  doc.setFontSize(6.5);
  doc.text(`Payment ID: ${paymentRecord?.razorpay_payment_id || 'Captured via Gateway'}`, margin + 6, tableEndY + 46);
  doc.text(`Issued by CineTicket Platform under Cinema Exhibition Rules.`, margin + 6, tableEndY + 51);

  // Right Box: Financial Invoice Summary
  const summaryBoxWidth = contentWidth * 0.49;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;

  doc.setFillColor(...surfaceLight);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(summaryBoxX, tableEndY, summaryBoxWidth, bottomBoxHeight, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textDark);
  doc.text('Payment Summary', summaryBoxX + 6, tableEndY + 7);

  const subtotal = Number(booking.subtotal || 0).toFixed(2);
  const fee = Number(booking.convenience_fee || 0);
  const total = Number(booking.total_amount || 0).toFixed(2);

  let calcY = tableEndY + 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('Seat Base Price:', summaryBoxX + 6, calcY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`INR ${subtotal}`, summaryBoxX + summaryBoxWidth - 6, calcY, { align: 'right' });

  calcY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Convenience Fee (incl. GST):', summaryBoxX + 6, calcY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(fee > 0 ? `INR ${fee.toFixed(2)}` : 'INR 0.00 (Waived)', summaryBoxX + summaryBoxWidth - 6, calcY, { align: 'right' });

  // Divider inside summary
  calcY += 5;
  doc.setDrawColor(...borderLight);
  doc.line(summaryBoxX + 6, calcY, summaryBoxX + summaryBoxWidth - 6, calcY);

  // Grand Total Card inside Summary
  calcY += 4;
  doc.setFillColor(254, 226, 226); // Soft crimson tint
  doc.roundedRect(summaryBoxX + 4, calcY, summaryBoxWidth - 8, 14, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...textDark);
  doc.text('Total Amount Paid:', summaryBoxX + 8, calcY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryCrimson);
  doc.text(`INR ${total}`, summaryBoxX + summaryBoxWidth - 8, calcY + 9, { align: 'right' });

  // ── Footer: Terms & Legal ────────────────────────────────────────────────
  const footerY = pageHeight - 22;
  doc.setDrawColor(...borderLight);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...textMuted);
  doc.text('Terms & Conditions: 1. Carry a digital copy with valid photo ID. 2. Admission subject to movie censor certificate guidelines.', margin, footerY + 2);
  doc.text('3. Cancellations allowed only before scheduled show start time per cinema cancellation policy. 4. Computer-generated tax invoice.', margin, footerY + 6);
  doc.text('CineTicket • www.cineticket.in • Support: support@cineticket.in', margin, footerY + 10);

  doc.save(`bill-${booking.booking_code}.pdf`);
}
