/** Unit conversion tables — pure logic shared by the converter and tests. */

export type UnitFamily = "length" | "weight" | "temperature" | "area" | "volume" | "speed" | "data" | "time";

export interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  /** Value of 1 unit expressed in the family's base unit. */
  factor: number;
}

/** Temperature is converted by formula rather than factors. */
export const UNIT_FAMILIES: Record<Exclude<UnitFamily, "temperature">, UnitDef[]> = {
  length: [
    { id: "mm", name: "Millimetre", symbol: "mm", factor: 0.001 },
    { id: "cm", name: "Centimetre", symbol: "cm", factor: 0.01 },
    { id: "m", name: "Metre", symbol: "m", factor: 1 },
    { id: "km", name: "Kilometre", symbol: "km", factor: 1000 },
    { id: "in", name: "Inch", symbol: "in", factor: 0.0254 },
    { id: "ft", name: "Foot", symbol: "ft", factor: 0.3048 },
    { id: "yd", name: "Yard", symbol: "yd", factor: 0.9144 },
    { id: "mi", name: "Mile", symbol: "mi", factor: 1609.344 },
    { id: "nmi", name: "Nautical mile", symbol: "nmi", factor: 1852 },
  ],
  weight: [
    { id: "mg", name: "Milligram", symbol: "mg", factor: 0.000001 },
    { id: "g", name: "Gram", symbol: "g", factor: 0.001 },
    { id: "kg", name: "Kilogram", symbol: "kg", factor: 1 },
    { id: "t", name: "Metric ton", symbol: "t", factor: 1000 },
    { id: "oz", name: "Ounce", symbol: "oz", factor: 0.028349523125 },
    { id: "lb", name: "Pound", symbol: "lb", factor: 0.45359237 },
    { id: "st", name: "Stone", symbol: "st", factor: 6.35029318 },
  ],
  area: [
    { id: "mm2", name: "Square millimetre", symbol: "mm²", factor: 0.000001 },
    { id: "cm2", name: "Square centimetre", symbol: "cm²", factor: 0.0001 },
    { id: "m2", name: "Square metre", symbol: "m²", factor: 1 },
    { id: "ha", name: "Hectare", symbol: "ha", factor: 10000 },
    { id: "km2", name: "Square kilometre", symbol: "km²", factor: 1000000 },
    { id: "in2", name: "Square inch", symbol: "in²", factor: 0.00064516 },
    { id: "ft2", name: "Square foot", symbol: "ft²", factor: 0.09290304 },
    { id: "ac", name: "Acre", symbol: "ac", factor: 4046.8564224 },
    { id: "mi2", name: "Square mile", symbol: "mi²", factor: 2589988.110336 },
  ],
  volume: [
    { id: "ml", name: "Millilitre", symbol: "ml", factor: 0.001 },
    { id: "l", name: "Litre", symbol: "L", factor: 1 },
    { id: "m3", name: "Cubic metre", symbol: "m³", factor: 1000 },
    { id: "tsp", name: "Teaspoon (US)", symbol: "tsp", factor: 0.00492892 },
    { id: "tbsp", name: "Tablespoon (US)", symbol: "tbsp", factor: 0.0147868 },
    { id: "flozus", name: "Fluid ounce (US)", symbol: "fl oz", factor: 0.0295735 },
    { id: "cup", name: "Cup (US)", symbol: "cup", factor: 0.236588 },
    { id: "pt", name: "Pint (US)", symbol: "pt", factor: 0.473176 },
    { id: "qt", name: "Quart (US)", symbol: "qt", factor: 0.946353 },
    { id: "gal", name: "Gallon (US)", symbol: "gal", factor: 3.785412 },
    { id: "galuk", name: "Gallon (UK)", symbol: "gal UK", factor: 4.54609 },
  ],
  speed: [
    { id: "mps", name: "Metre / second", symbol: "m/s", factor: 1 },
    { id: "kph", name: "Kilometre / hour", symbol: "km/h", factor: 0.277777778 },
    { id: "mph", name: "Mile / hour", symbol: "mph", factor: 0.44704 },
    { id: "fps", name: "Foot / second", symbol: "ft/s", factor: 0.3048 },
    { id: "kn", name: "Knot", symbol: "kn", factor: 0.514444 },
    { id: "mach", name: "Mach (sea level)", symbol: "Ma", factor: 340.29 },
  ],
  data: [
    { id: "b", name: "Bit", symbol: "b", factor: 0.125 },
    { id: "B", name: "Byte", symbol: "B", factor: 1 },
    { id: "KB", name: "Kilobyte (1000)", symbol: "kB", factor: 1000 },
    { id: "KiB", name: "Kibibyte (1024)", symbol: "KiB", factor: 1024 },
    { id: "MB", name: "Megabyte", symbol: "MB", factor: 1e6 },
    { id: "MiB", name: "Mebibyte", symbol: "MiB", factor: 1048576 },
    { id: "GB", name: "Gigabyte", symbol: "GB", factor: 1e9 },
    { id: "GiB", name: "Gibibyte", symbol: "GiB", factor: 1073741824 },
    { id: "TB", name: "Terabyte", symbol: "TB", factor: 1e12 },
    { id: "TiB", name: "Tebibyte", symbol: "TiB", factor: 1099511627776 },
  ],
  time: [
    { id: "ms", name: "Millisecond", symbol: "ms", factor: 0.001 },
    { id: "s", name: "Second", symbol: "s", factor: 1 },
    { id: "min", name: "Minute", symbol: "min", factor: 60 },
    { id: "h", name: "Hour", symbol: "h", factor: 3600 },
    { id: "d", name: "Day", symbol: "d", factor: 86400 },
    { id: "wk", name: "Week", symbol: "wk", factor: 604800 },
    { id: "mo", name: "Month (30.44 d)", symbol: "mo", factor: 2629800 },
    { id: "yr", name: "Year (365.25 d)", symbol: "yr", factor: 31557600 },
  ],
};

export const TEMPERATURE_UNITS = [
  { id: "C", name: "Celsius", symbol: "°C" },
  { id: "F", name: "Fahrenheit", symbol: "°F" },
  { id: "K", name: "Kelvin", symbol: "K" },
] as const;

export type TemperatureUnit = (typeof TEMPERATURE_UNITS)[number]["id"];

export function convertTemperature(value: number, from: TemperatureUnit, to: TemperatureUnit): number {
  // to Celsius first
  let c: number;
  if (from === "C") c = value;
  else if (from === "F") c = ((value - 32) * 5) / 9;
  else c = value - 273.15;
  if (to === "C") return c;
  if (to === "F") return (c * 9) / 5 + 32;
  return c + 273.15;
}

export function convertUnit(value: number, fromId: string, toId: string, family: UnitFamily): number | null {
  if (family === "temperature") {
    return convertTemperature(value, fromId as TemperatureUnit, toId as TemperatureUnit);
  }
  const units = UNIT_FAMILIES[family];
  const from = units.find((u) => u.id === fromId);
  const to = units.find((u) => u.id === toId);
  if (!from || !to || from.factor === 0) return null;
  return (value * from.factor) / to.factor;
}

export function formatConversion(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-6 || abs >= 1e15)) return value.toExponential(6);
  return new Intl.NumberFormat("en-US", { maximumSignificantDigits: 10 }).format(value);
}
