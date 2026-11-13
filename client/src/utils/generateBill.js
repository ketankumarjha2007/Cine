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
  const margin = 20;

  // Colors
  const primaryColor = [225, 29, 72]; // #E11D48
  const darkTextColor = [20, 20, 28];
  const mutedTextColor = [108, 108, 125];

  // Header - CineTicket
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text('CineTicket', margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...mutedTextColor);
  doc.text('TAX INVOICE & BOOKING RECEIPT', margin, 30);

  // Booking details right-aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkTextColor);
  doc.text(`Booking Ref: ${booking.booking_code}`, pageWidth - margin, 24, { align: 'right' });

  const bookedAt = booking.confirmed_at || booking.created_at;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  doc.text(`Date: ${formatDateIST(bookedAt)} ${formatTimeIST(bookedAt)} IST`, pageWidth - margin, 30, { align: 'right' });

  // Divider
  doc.setDrawColor(220, 220, 230);
  doc.line(margin, 36, pageWidth - margin, 36);

  // Customer Information
  let currentY = 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkTextColor);
  doc.text('Customer Details', margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  doc.text(`Name: ${booking.customerName || 'Valued Customer'}`, margin, currentY);
  if (booking.customerEmail) {
    currentY += 5;
    doc.text(`Email: ${booking.customerEmail}`, margin, currentY);
  }

  // Movie & Theatre Details
  currentY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkTextColor);
  const movieTitle = booking.shows?.movie?.title || 'Movie Title';
  const language = booking.shows?.language || 'English';
  const format = booking.shows?.format || '2D';
  doc.text(`${movieTitle} (${language} | ${format})`, margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  const theatreName = booking.shows?.screen?.theatre?.name || 'Cinema';
  const theatreAddress = [
    booking.shows?.screen?.theatre?.address,
    booking.shows?.screen?.theatre?.city,
    booking.shows?.screen?.theatre?.pincode
  ].filter(Boolean).join(', ');
  const screenName = booking.shows?.screen?.name || 'Screen';

  doc.text(`Cinema: ${theatreName} - ${theatreAddress}`, margin, currentY);
  currentY += 5;
  const showDate = formatDateIST(booking.shows?.starts_at);
  const showTime = formatTimeIST(booking.shows?.starts_at);
  doc.text(`Show: ${screenName} | ${showDate} at ${showTime} IST`, margin, currentY);

  // Seat Breakdown Table
  currentY += 8;
  const tableRows = (booking.booking_seats || []).map((bs, index) => [
    index + 1,
    `Row ${bs.seat?.row_label || ''} - Seat ${bs.seat?.seat_number || ''}`,
    bs.seat?.category || 'Standard',
    `INR ${Number(bs.price || 0).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Seat Description', 'Category', 'Price']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [28, 28, 39],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      3: { halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  const finalY = doc.lastAutoTable.finalY + 8;
  let summaryY = finalY;

  // Subtotal, convenience fee (only if > 0), and grand total
  const subtotal = Number(booking.subtotal || 0).toFixed(2);
  const fee = Number(booking.convenience_fee || 0);
  const total = Number(booking.total_amount || 0).toFixed(2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...darkTextColor);
  doc.text('Subtotal:', pageWidth - 70, summaryY);
  doc.text(`INR ${subtotal}`, pageWidth - margin, summaryY, { align: 'right' });

  if (fee > 0) {
    summaryY += 6;
    doc.text('Convenience Fee:', pageWidth - 70, summaryY);
    doc.text(`INR ${fee.toFixed(2)}`, pageWidth - margin, summaryY, { align: 'right' });
  }

  summaryY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('Grand Total:', pageWidth - 70, summaryY);
  doc.text(`INR ${total}`, pageWidth - margin, summaryY, { align: 'right' });

  // Payment information
  let paymentY = finalY;
  const paymentRecord = Array.isArray(booking.payments) ? booking.payments[0] : booking.payments;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  doc.text(`Payment ID: ${paymentRecord?.razorpay_payment_id || 'Captured via Gateway'}`, margin, paymentY);
  paymentY += 5;
  doc.text(`Payment Status: ${booking.status === 'CONFIRMED' ? 'SUCCESS / PAID' : booking.status}`, margin, paymentY);

  // QR Code for booking code verification
  try {
    const qrDataUrl = await QRCode.toDataURL(booking.booking_code, {
      margin: 1,
      width: 100,
      color: {
        dark: '#14141C',
        light: '#FFFFFF'
      }
    });
    doc.addImage(qrDataUrl, 'PNG', margin, paymentY + 8, 30, 30);
    doc.setFontSize(8);
    doc.text('Scan for Verification at Box Office', margin, paymentY + 42);
  } catch (qrErr) {
    console.warn('[QR GENERATION ERROR]', qrErr);
  }

  // Terms and conditions note at footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text('Terms & Conditions:', margin, pageHeight - 20);
  doc.text('1. Please carry a valid physical or digital copy of this bill along with a government photo ID.', margin, pageHeight - 16);
  doc.text('2. Admission is subject to cinema rules and film certification guidelines.', margin, pageHeight - 12);
  doc.text('3. Confirmed tickets may be cancelled strictly before the scheduled show start time.', margin, pageHeight - 8);

  doc.save(`bill-${booking.booking_code}.pdf`);
}
