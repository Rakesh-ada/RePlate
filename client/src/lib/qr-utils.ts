// Re-export from shared utilities
export { generateClaimCode } from "@shared/qr-utils";

export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();

  if (diff <= 0) {
    return "Expired";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  } else {
    return `${minutes}m left`;
  }
}

export function generateQRCodeDataURL(qrCode: string): string {
  // For a real implementation, you would use a QR code library like 'qrcode'
  // For now, return a placeholder data URL
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 200;
  canvas.height = 200;
  
  if (ctx) {
    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    
    // Draw simple QR-like pattern
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        if ((i + j + qrCode.length) % 3 === 0) {
          ctx.fillRect(i * 10, j * 10, 8, 8);
        }
      }
    }
    
    // Add corner squares
    ctx.fillRect(0, 0, 50, 50);
    ctx.fillRect(150, 0, 50, 50);
    ctx.fillRect(0, 150, 50, 50);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 10, 30, 30);
    ctx.fillRect(160, 10, 30, 30);
    ctx.fillRect(10, 160, 30, 30);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(20, 20, 10, 10);
    ctx.fillRect(170, 20, 10, 10);
    ctx.fillRect(20, 170, 10, 10);
  }
  
  return canvas.toDataURL();
}
