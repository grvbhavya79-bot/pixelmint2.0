import type { ToolDefinition } from "../types";

export const CALCULATOR_TOOLS: ToolDefinition[] = [
  {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    category: "calculators",
    description: "X% of Y, increase, decrease and percentage difference — all in one place.",
    longDescription:
      "Four everyday percentage questions answered instantly: what is X% of Y, X is what percent of Y, the percentage change from X to Y, and increase/decrease by a percent.",
    tags: ["percentage", "percent", "increase", "decrease", "difference", "math"],
    popular: true,
    component: "PercentageCalc",
    icon: "Percent",
    process: "local",
  },
  {
    slug: "age-calculator",
    name: "Age Calculator",
    category: "calculators",
    description: "Calculate exact age in years, months and days — plus days lived.",
    longDescription:
      "Enter a birth date to get exact years, months and days, along with total days lived, hours, the next birthday countdown and weekday of birth.",
    tags: ["age", "birthday", "years", "months", "days", "calculator"],
    popular: true,
    component: "AgeCalc",
    icon: "Cake",
    process: "local",
  },
  {
    slug: "bmi-calculator",
    name: "BMI Calculator",
    category: "calculators",
    description: "Calculate Body Mass Index in metric or imperial units with a category scale.",
    longDescription:
      "Enter height and weight in centimetres/kilograms or feet+pounds to get your BMI, the WHO weight category, the healthy-weight range for your height and a visual scale.",
    tags: ["bmi", "body mass index", "health", "weight", "fitness"],
    component: "BmiCalc",
    icon: "HeartPulse",
    process: "local",
  },
  {
    slug: "emi-calculator",
    name: "EMI Calculator",
    category: "calculators",
    description: "Compute monthly EMI, total interest and total repayment for any loan.",
    longDescription:
      "Enter loan amount, annual interest rate and tenure to get the exact monthly installment, total interest payable and total repayment — with a principal-vs-interest breakdown chart.",
    tags: ["emi", "loan", "mortgage", "installment", "interest", "finance"],
    popular: true,
    component: "EmiCalc",
    icon: "Landmark",
    process: "local",
  },
  {
    slug: "gst-calculator",
    name: "GST Calculator",
    category: "calculators",
    description: "Add or remove GST at standard or custom rates, inclusive or exclusive.",
    longDescription:
      "Work backwards or forwards through GST: extract tax from a GST-inclusive price, or add GST to a base amount — at 5%, 12%, 18%, 28% or any custom slab.",
    tags: ["gst", "tax", "india", "inclusive", "exclusive", "vat"],
    component: "GstCalc",
    icon: "Receipt",
    process: "local",
  },
  {
    slug: "discount-calculator",
    name: "Discount Calculator",
    category: "calculators",
    description: "Find the final price after discounts — including stacked discounts.",
    longDescription:
      "Enter price and discount percent to see the saving and final price. Two discounts can be stacked to see the combined effect, like those 'extra 10% off' sales.",
    tags: ["discount", "sale", "price", "off", "saving", "shopping"],
    component: "DiscountCalc",
    icon: "Tag",
    process: "local",
  },
  {
    slug: "time-calculator",
    name: "Time Calculator",
    category: "calculators",
    description: "Add or subtract hours, minutes and seconds with a running breakdown.",
    longDescription:
      "Sum up work shifts, race laps or meeting times — or subtract one duration from another. Times can also be converted into decimal hours for timesheets.",
    tags: ["time", "add", "subtract", "duration", "hours", "minutes", "seconds"],
    component: "TimeCalc",
    icon: "Timer",
    process: "local",
  },
  {
    slug: "date-difference-calculator",
    name: "Date Difference Calculator",
    category: "calculators",
    description: "Find the exact span between two dates in days, weeks, months and years.",
    longDescription:
      "Pick any two dates to measure the gap in total days, business days, and broken-down years/months/days — including or excluding the end date.",
    tags: ["date", "difference", "between", "days", "duration", "period"],
    component: "DateDiffCalc",
    icon: "CalendarRange",
    process: "local",
  },
  {
    slug: "unit-converter",
    name: "Unit Converter",
    category: "calculators",
    description: "Convert length, weight, temperature, area, volume, speed, data and time units.",
    longDescription:
      "A precise converter covering eight measurement families — from millimetres to miles, bytes to gibibytes and Celsius to Fahrenheit — with sensible defaults and instant results.",
    tags: ["unit", "convert", "length", "weight", "temperature", "area", "volume", "speed", "data"],
    component: "UnitConverter",
    icon: "Ruler",
    process: "local",
  },
  {
    slug: "currency-converter",
    name: "Currency Converter",
    category: "calculators",
    description: "Convert between 30+ world currencies using live exchange rates.",
    longDescription:
      "Live foreign-exchange rates power instant conversion between major currencies including INR, USD, EUR, GBP and JPY. Rates refresh from a reliable public API with the update time always shown.",
    tags: ["currency", "exchange", "rate", "money", "forex", "usd", "inr", "convert"],
    popular: true,
    component: "CurrencyConverter",
    icon: "CircleDollarSign",
    process: "server",
    faqs: [
      {
        q: "How fresh are the exchange rates?",
        a: "Rates come from a live public exchange-rate API and are cached server-side for a short window. The exact 'last updated' time is always displayed under the result.",
      },
    ],
  },
];
