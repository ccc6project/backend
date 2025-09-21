// src/utils/creditCardUtils.ts
export function generateCardNumber(): string {
  let number = '';
  for (let i = 0; i < 16; i++) number += Math.floor(Math.random() * 10);
  return number;
}
export function generateCVV(): string {
  return (100 + Math.floor(Math.random() * 900)).toString();
}
export function generateExpiration(years = 5): string {
  const now = new Date();
  const year = now.getFullYear() + years;
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  return `${year}${month}`; // yyyymm
}
export function validateCardNumber(card: string) {
  return typeof card === 'string' && /^[0-9]{16}$/.test(card);
}
export function validateExpDate(exp: string) {
  return typeof exp === 'string' && /^[0-9]{6}$/.test(exp);
}
export function validateCVV(cvv: string) {
  return typeof cvv === 'string' && /^[0-9]{3}$/.test(cvv);
}
export function validateDateYMD(date: string) {
  return typeof date === 'string' && /^[0-9]{8}$/.test(date);
}
