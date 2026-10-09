import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Stamps a translucent watermark on every page of a PDF.
 *
 * @param {Buffer|Uint8Array} pdfBuffer - The original PDF file bytes
 * @param {object} userInfo
 * @param {string} userInfo.email     - User email
 * @param {string} userInfo.phoneNumber - User phone number
 * @param {string} userInfo.ipAddress  - Request IP address
 * @returns {Promise<Uint8Array>} The watermarked PDF bytes
 */
export async function watermarkPdf(pdfBuffer, { email, phoneNumber, ipAddress }) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const watermarkText = `Licensed to: ${email} | ${phoneNumber} | ${ipAddress}`;
  const fontSize = 8;
  const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Bottom-right corner watermark (semi-transparent)
    page.drawText(watermarkText, {
      x: width - textWidth - 20,
      y: 15,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.35,
    });

    // Diagonal center watermark (very faint, large)
    const diagonalFontSize = 40;
    const diagonalText = email;
    const diagonalWidth = font.widthOfTextAtSize(diagonalText, diagonalFontSize);

    page.drawText(diagonalText, {
      x: (width - diagonalWidth) / 2,
      y: height / 2,
      size: diagonalFontSize,
      font,
      color: rgb(0.85, 0.85, 0.85),
      opacity: 0.12,
      rotate: { type: 'degrees', angle: 45 },
    });
  }

  return pdfDoc.save();
}
