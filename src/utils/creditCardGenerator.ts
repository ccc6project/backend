// src/utils/creditCardGenerator.ts
export function generateCardNumber(isAmex: boolean): string {
  if (isAmex) {
    // AMEX cards: 15 digits, start with 34 or 37
    const prefix = Math.random() < 0.5 ? "34" : "37";
    let number = prefix;
    for (let i = 0; i < 13; i++) number += Math.floor(Math.random() * 10);
    return number;
  } else {
    // Visa/Master: 16 digits, start with 4 (Visa) or 5 (Master)
    const prefix = Math.random() < 0.5 ? "4" : "5";
    let number = prefix;
    for (let i = 0; i < 15; i++) number += Math.floor(Math.random() * 10);
    return number;
  }
}

export function generateCVV(isAmex: boolean): string {
  return isAmex
    ? (1000 + Math.floor(Math.random() * 9000)).toString().slice(0, 4)
    : (100 + Math.floor(Math.random() * 900)).toString();
}

export function generateExpiration(years = 5): string {
  const now = new Date();
  const year = now.getFullYear() + years;
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  return `${year}${month}`; // yyyymm
}
