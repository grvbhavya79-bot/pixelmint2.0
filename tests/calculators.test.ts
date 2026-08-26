import { describe, expect, test } from "bun:test";
import {
  percentOf, whatPercent, percentChange, applyPercent, percentDifference,
  calculateAge, calculateBmiMetric, bmiCategoryOf, calculateEmi,
  addGst, removeGst, calculateDiscount, dateDifference, secondsToParts, parseDurationParts,
} from "@/lib/calc";

describe("percentage calculator", () => {
  test("X% of Y", () => {
    expect(percentOf(25, 200)).toBe(50);
    expect(percentOf(10, 50)).toBe(5);
    expect(percentOf(150, 100)).toBe(150);
  });

  test("X is what percent of Y", () => {
    expect(whatPercent(50, 200)).toBe(25);
    expect(whatPercent(10, 40)).toBe(25);
  });

  test("percentage change", () => {
    expect(percentChange(80, 100)).toBeCloseTo(25);
    expect(percentChange(100, 80)).toBeCloseTo(-20);
    expect(percentChange(50, 50)).toBe(0);
  });

  test("increase and decrease", () => {
    expect(applyPercent(100, 10, "increase")).toBe(110);
    expect(applyPercent(100, 10, "decrease")).toBe(90);
  });

  test("percentage difference", () => {
    expect(percentDifference(10, 10)).toBe(0);
    expect(percentDifference(40, 60)).toBeCloseTo(40);
  });
});

describe("age calculator", () => {
  test("exact years, months, days", () => {
    const age = calculateAge(new Date(2000, 0, 15), new Date(2024, 5, 15));
    expect(age.years).toBe(24);
    expect(age.months).toBe(5);
    expect(age.days).toBe(0);
  });

  test("handles month-end borrowing", () => {
    const age = calculateAge(new Date(2000, 0, 31), new Date(2024, 2, 1));
    expect(age.years).toBe(24);
    expect(age.months).toBe(1);
    expect(age.days).toBeGreaterThanOrEqual(0);
  });

  test("next birthday countdown is positive", () => {
    const age = calculateAge(new Date(1995, 5, 10), new Date(2024, 0, 1));
    expect(age.nextBirthdayIn).toBeGreaterThan(0);
    expect(age.bornOnWeekday).toBeTruthy();
  });
});

describe("BMI calculator", () => {
  test("metric BMI", () => {
    const result = calculateBmiMetric(170, 65);
    expect(result.bmi).toBeCloseTo(22.5, 0);
    expect(result.category).toBe("Normal weight");
  });

  test("categories", () => {
    expect(bmiCategoryOf(17)).toBe("Underweight");
    expect(bmiCategoryOf(22)).toBe("Normal weight");
    expect(bmiCategoryOf(27)).toBe("Overweight");
    expect(bmiCategoryOf(32)).toBe("Obese");
  });

  test("healthy range brackets BMI 18.5-25", () => {
    const { healthyMin, healthyMax } = calculateBmiMetric(180, 80);
    // healthy weights map back to BMI 18.5 / ~24.9 at 1.8 m
    expect(calculateBmiMetric(180, healthyMin).bmi).toBeCloseTo(18.5, 1);
    expect(calculateBmiMetric(180, healthyMax).bmi).toBeCloseTo(24.9, 1);
  });
});

describe("EMI calculator", () => {
  test("standard EMI", () => {
    // 1,000,000 at 10%/yr for 10 years → EMI ≈ 13,215.07
    const result = calculateEmi(1000000, 10, 10);
    expect(result.emi).toBeCloseTo(13215.07, 0);
    expect(result.months).toBe(120);
  });

  test("zero interest", () => {
    const result = calculateEmi(120000, 0, 1);
    expect(result.emi).toBe(10000);
    expect(result.totalInterest).toBe(0);
  });

  test("total payment = principal + interest", () => {
    const result = calculateEmi(500000, 8.5, 5);
    expect(result.totalPayment).toBeCloseTo(500000 + result.totalInterest, 1);
  });
});

describe("GST calculator", () => {
  test("add GST (exclusive)", () => {
    const result = addGst(1000, 18);
    expect(result.gst).toBe(180);
    expect(result.total).toBe(1180);
  });

  test("remove GST (inclusive)", () => {
    const result = removeGst(1180, 18);
    expect(result.base).toBeCloseTo(1000, 1);
    expect(result.gst).toBeCloseTo(180, 1);
  });

  test("custom rate", () => {
    const result = addGst(200, 5);
    expect(result.total).toBe(210);
  });
});

describe("discount calculator", () => {
  test("single discount", () => {
    const result = calculateDiscount(1000, 20);
    expect(result.final).toBe(800);
    expect(result.totalOff).toBe(200);
  });

  test("stacked discounts are multiplicative", () => {
    const result = calculateDiscount(1000, 50, 50);
    expect(result.final).toBe(250);
  });
});

describe("time calculator", () => {
  test("parts to seconds and back", () => {
    const total = parseDurationParts(2, 45, 30);
    expect(total).toBe(9930);
    expect(secondsToParts(total)).toEqual({ h: 2, m: 45, s: 30 });
  });

  test("carries across units", () => {
    const parts = secondsToParts(3661);
    expect(parts).toEqual({ h: 1, m: 1, s: 1 });
  });
});

describe("date difference calculator", () => {
  test("simple day count", () => {
    const result = dateDifference(new Date(2024, 0, 1), new Date(2024, 0, 31));
    expect(result.totalDays).toBe(30);
  });

  test("include end day adds one", () => {
    const result = dateDifference(new Date(2024, 0, 1), new Date(2024, 0, 31), true);
    expect(result.totalDays).toBe(31);
  });

  test("broken-down duration", () => {
    const result = dateDifference(new Date(2024, 0, 15), new Date(2024, 2, 14));
    expect(result.months).toBe(1);
    expect(result.days).toBe(28);
  });

  test("business days exclude weekends", () => {
    // 2024-01-01 (Mon) to 2024-01-07 (Sun) = 7 days, 5 business days
    const result = dateDifference(new Date(2024, 0, 1), new Date(2024, 0, 7));
    expect(result.businessDays).toBe(5);
  });
});
