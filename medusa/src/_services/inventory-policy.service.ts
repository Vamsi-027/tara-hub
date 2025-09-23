export type RoundingMode = "up" | "down" | "nearest";

export type BackorderPolicy = "deny" | "allow_date" | "allow_any";

export interface QuantityRules {
  min_increment: number; // e.g., 0.25 yard
  min_cut?: number; // e.g., 1 yard
  rounding_mode?: RoundingMode; // default: nearest
  backorder_policy?: BackorderPolicy; // default: deny
}

export interface NormalizeResult {
  decimal: number;
  baseUnits: number;
  wasRounded: boolean;
}

export const getBaseUnitFactor = (minIncrement: number): number => {
  if (minIncrement <= 0) {
    throw new Error("min_increment must be > 0");
  }
  const factor = Math.round(1 / minIncrement);
  const reconstructed = 1 / factor;
  // Guard against non-even divisors like 0.3
  if (Math.abs(reconstructed - minIncrement) > 1e-10) {
    // Fallback: use decimal precision up to 1e-6
    const scaled = Math.round(minIncrement * 1_000_000);
    return Math.round(1_000_000 / scaled);
  }
  return factor;
};

export const toBaseUnits = (
  decimalQty: number,
  minIncrement: number,
  rounding: RoundingMode = "nearest"
): number => {
  const factor = getBaseUnitFactor(minIncrement);
  const rawUnits = decimalQty * factor;
  let units: number;
  switch (rounding) {
    case "up":
      units = Math.ceil(rawUnits - 1e-10);
      break;
    case "down":
      units = Math.floor(rawUnits + 1e-10);
      break;
    default:
      units = Math.round(rawUnits);
  }
  return units;
};

export const fromBaseUnits = (baseUnits: number, minIncrement: number): number => {
  const factor = getBaseUnitFactor(minIncrement);
  return baseUnits / factor;
};

export const normalizeQuantity = (qty: number, rules: QuantityRules): NormalizeResult => {
  const { min_increment, rounding_mode = "nearest", min_cut } = rules;
  if (qty < 0) {
    throw new Error("Quantity must be >= 0");
  }
  if (min_cut && qty < min_cut - 1e-12) {
    throw new Error(`Quantity below min_cut (${min_cut})`);
  }

  const units = toBaseUnits(qty, min_increment, rounding_mode);
  const normalized = fromBaseUnits(units, min_increment);
  const wasRounded = Math.abs(normalized - qty) > 1e-9;
  return { decimal: normalized, baseUnits: units, wasRounded };
};

export interface AtsParams {
  stockedUnits: number; // base units
  reservedUnits: number; // base units
  incomingUnits?: number; // base units
  includeIncomingInAts?: boolean; // default false
}

export const computeAtsUnits = (params: AtsParams): number => {
  const { stockedUnits, reservedUnits, incomingUnits = 0, includeIncomingInAts = false } = params;
  const ats = stockedUnits - reservedUnits + (includeIncomingInAts ? incomingUnits : 0);
  return Math.max(0, ats);
};

export const computeAtsDecimal = (
  params: AtsParams & { minIncrement: number }
): number => {
  const units = computeAtsUnits(params);
  return fromBaseUnits(units, params.minIncrement);
};

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "backordered";

export const getStockStatus = (atsUnits: number, lowStockThresholdDecimal: number, minIncrement: number): StockStatus => {
  if (atsUnits <= 0) {
    return "out_of_stock";
  }
  const thresholdUnits = toBaseUnits(lowStockThresholdDecimal, minIncrement, "nearest");
  return atsUnits <= thresholdUnits ? "low_stock" : "in_stock";
};

export interface BackorderDecision {
  allowed: boolean;
  reason?: string;
}

export const decideBackorder = (
  policy: BackorderPolicy = "deny",
  atsUnits: number
): BackorderDecision => {
  if (atsUnits > 0) return { allowed: true };
  switch (policy) {
    case "allow_any":
      return { allowed: true };
    case "allow_date":
      // Enforcement of promised date lives elsewhere; allowed here.
      return { allowed: true };
    case "deny":
    default:
      return { allowed: false, reason: "Backorders disabled" };
  }
};

