export function generateQRCode(): string {
  // Generate a unique QR code string
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `REPLATE_${timestamp}_${random}`;
}