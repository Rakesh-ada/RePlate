export function generateClaimCode(): string {
  // Generate a unique claim code for canteen staff verification
  const random1 = Math.random().toString(36).substring(2, 5).toUpperCase();
  const random2 = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${random1}-${random2}`;
}