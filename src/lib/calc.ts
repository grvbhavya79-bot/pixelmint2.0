/**
 * Pure calculator logic — shared by the calculator tools and unit tests.
 */

/* ------------------------------- Percentage ------------------------------- */

export function percentOf(x: number, y: number): number {
  return (x / 100) * y;
}

export function whatPercent(x: number, y: number): number {
  if (y === 0) return 0;
  return (x / y) * 100;
}

export function percentChange(from: number, to: number): number {
  if (from === 0) return 0;
  return ((to - from) / Math.abs(from)) * 100;
}

export function applyPercent(value: number, percent: number, direction: "increase" | "decrease"): number {
  const raw = direction === "increase" ? value * (1 + percent / 100) : value * (1 - percent / 100);
  return Math.round(raw * 1e10) / 1e10;
}

export function percentDifference(a: number, b: number): number {
  const avg = (a + b) / 2;
  if (avg === 0) return 0;
  return (Math.abs(a - b) / avg) * 100;
}

/* ---------------------------------- Age ---------------------------------- */

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalHours: number;
  nextBirthdayIn: number | null;
  bornOnWeekday: string;
}

export function calculateAge(birth: Date, at: Date = new Date()): AgeResult {
  let years = at.getFullYear() - birth.getFullYear();
  let months = at.getMonth() - birth.getMonth();
  let days = at.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(at.getFullYear(), at.getMonth(), 0).getDate();
    days += prevMonth;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMs = at.getTime() - birth.getTime();
  const totalDays = Math.floor(totalMs / 86400000);

  let next = new Date(at.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < at) next = new Date(at.getFullYear() + 1, birth.getMonth(), birth.getDate());
  const nextBirthdayIn = Math.ceil((next.getTime() - at.getTime()) / 86400000);

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    totalDays,
    totalHours: Math.floor(totalMs / 3600000),
    nextBirthdayIn: Number.isFinite(nextBirthdayIn) ? nextBirthdayIn : null,
    bornOnWeekday: birth.toLocaleDateString("en-US", { weekday: "long" }),
  };
}

/* ---------------------------------- BMI ---------------------------------- */

export type BmiCategory =
  | "Underweight"
  | "Normal weight"
  | "Overweight"
  | "Obese";

export interface BmiResult {
  bmi: number;
  category: BmiCategory;
  healthyMin: number;
  healthyMax: number;
}

export function bmiCategoryOf(bmi: number): BmiCategory {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function calculateBmiMetric(heightCm: number, weightKg: number): BmiResult {
  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  return {
    bmi: Math.round(bmi * 10) / 10,
    category: bmiCategoryOf(bmi),
    healthyMin: Math.round(18.5 * m * m * 10) / 10,
    healthyMax: Math.round(24.9 * m * m * 10) / 10,
  };
}

export function calculateBmiImperial(feet: number, inches: number, pounds: number): BmiResult {
  const totalInches = feet * 12 + inches;
  const heightCm = totalInches * 2.54;
  const weightKg = pounds * 0.45359237;
  const result = calculateBmiMetric(heightCm, weightKg);
  return {
    ...result,
    healthyMin: Math.round(result.healthyMin / 0.45359237 * 10) / 10,
    healthyMax: Math.round(result.healthyMax / 0.45359237 * 10) / 10,
  };
}

/* ---------------------------------- EMI ---------------------------------- */

export interface EmiResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  monthlyRate: number;
  months: number;
}

export function calculateEmi(principal: number, annualRatePercent: number, years: number): EmiResult {
  const months = Math.round(years * 12);
  const monthlyRate = annualRatePercent / 12 / 100;
  let emi: number;
  if (monthlyRate === 0) {
    emi = principal / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    emi = (principal * monthlyRate * factor) / (factor - 1);
  }
  const totalPayment = emi * months;
  return {
    emi: Math.round(emi * 100) / 100,
    totalInterest: Math.round((totalPayment - principal) * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    monthlyRate,
    months,
  };
}

/* ---------------------------------- GST ---------------------------------- */

export interface GstResult {
  base: number;
  gst: number;
  total: number;
  rate: number;
}

export function addGst(base: number, ratePercent: number): GstResult {
  const gst = (base * ratePercent) / 100;
  return {
    base: round2(base),
    gst: round2(gst),
    total: round2(base + gst),
    rate: ratePercent,
  };
}

export function removeGst(inclusiveTotal: number, ratePercent: number): GstResult {
  const base = inclusiveTotal / (1 + ratePercent / 100);
  return {
    base: round2(base),
    gst: round2(inclusiveTotal - base),
    total: round2(inclusiveTotal),
    rate: ratePercent,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* -------------------------------- Discount -------------------------------- */

export interface DiscountResult {
  original: number;
  discount1: number;
  discount2: number;
  totalOff: number;
  final: number;
}

export function calculateDiscount(price: number, d1: number, d2 = 0): DiscountResult {
  const after1 = price * (1 - d1 / 100);
  const after2 = after1 * (1 - d2 / 100);
  return {
    original: price,
    discount1: round2(price - after1),
    discount2: round2(after1 - after2),
    totalOff: round2(price - after2),
    final: round2(after2),
  };
}

/* ---------------------------------- Time ---------------------------------- */

export function parseDurationParts(h: number, m: number, s: number): number {
  return h * 3600 + m * 60 + s;
}

export function secondsToParts(total: number): { h: number; m: number; s: number } {
  const sign = total < 0 ? -1 : 1;
  const t = Math.abs(Math.round(total));
  return {
    h: Math.floor(t / 3600) * sign,
    m: (Math.floor(t / 60) % 60) * sign,
    s: (t % 60) * sign,
  };
}

export function secondsToDecimalHours(total: number): number {
  return Math.round((total / 3600) * 10000) / 10000;
}

/* ------------------------------ Date diff -------------------------------- */

export interface DateDiffResult {
  totalDays: number;
  businessDays: number;
  years: number;
  months: number;
  days: number;
  weeks: number;
  includeEnd: boolean;
}

export function dateDifference(start: Date, end: Date, includeEnd = false): DateDiffResult {
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const dir = b >= a ? 1 : -1;
  const [from, to] = dir === 1 ? [a, b] : [b, a];
  const totalDays = Math.round((to.getTime() - from.getTime()) / 86400000) + (includeEnd ? 1 : 0);

  let businessDays = 0;
  const cursor = new Date(from);
  for (let i = 0; i < totalDays; i++) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) businessDays++;
    cursor.setDate(cursor.getDate() + 1);
  }

  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) {
    months--;
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  return {
    totalDays: totalDays * dir,
    businessDays: businessDays * dir,
    years,
    months,
    days,
    weeks: Math.floor((totalDays * dir) / 7),
    includeEnd,
  };
}
