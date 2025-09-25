import {
  getBaseUnitFactor,
  toBaseUnits,
  fromBaseUnits,
  normalizeQuantity,
  computeAtsUnits,
  computeAtsDecimal,
  getStockStatus,
  decideBackorder,
} from "../inventory-policy.service";

describe("Inventory Policy Service", () => {
  const minInc = 0.25; // quarter-yard base unit

  test("base unit factor from min_increment", () => {
    expect(getBaseUnitFactor(0.25)).toBe(4);
    expect(getBaseUnitFactor(0.5)).toBe(2);
  });

  test("to/from base units with rounding modes", () => {
    // 2.3 yards with nearest => 2.25 (9 units)
    const unitsNearest = toBaseUnits(2.3, minInc, "nearest");
    expect(unitsNearest).toBe(9);
    expect(fromBaseUnits(unitsNearest, minInc)).toBeCloseTo(2.25, 6);

    // up => 2.5 (10 units)
    const unitsUp = toBaseUnits(2.3, minInc, "up");
    expect(unitsUp).toBe(10);
    expect(fromBaseUnits(unitsUp, minInc)).toBeCloseTo(2.5, 6);

    // down => 2.25 (9 units)
    const unitsDown = toBaseUnits(2.3, minInc, "down");
    expect(unitsDown).toBe(9);
  });

  test("normalizeQuantity enforces min_cut and increments", () => {
    // below min_cut = 1 should throw
    expect(() =>
      normalizeQuantity(0.75, { min_increment: minInc, min_cut: 1, rounding_mode: "nearest" })
    ).toThrow(/min_cut/);

    // 2.3 rounds to 2.25 with nearest
    const n = normalizeQuantity(2.3, { min_increment: minInc, min_cut: 1, rounding_mode: "nearest" });
    expect(n.baseUnits).toBe(9);
    expect(n.decimal).toBeCloseTo(2.25, 6);
    expect(n.wasRounded).toBe(true);
  });

  test("ATS calculations in base units and decimal", () => {
    // stocked=20u (5 yd), reserved=4u (1 yd), incoming=4u (1 yd)
    const atsNoIncoming = computeAtsUnits({ stockedUnits: 20, reservedUnits: 4 });
    expect(atsNoIncoming).toBe(16); // 4 yd
    const atsWithIncoming = computeAtsUnits({ stockedUnits: 20, reservedUnits: 4, incomingUnits: 4, includeIncomingInAts: true });
    expect(atsWithIncoming).toBe(20); // 5 yd

    const atsDec = computeAtsDecimal({ stockedUnits: 20, reservedUnits: 4, minIncrement: minInc });
    expect(atsDec).toBeCloseTo(4, 6);
  });

  test("stock status uses low_stock_threshold", () => {
    const lowThresh = 1; // 1 yard
    expect(getStockStatus(0, lowThresh, minInc)).toBe("out_of_stock");
    // 0.5 yd => 2 units
    expect(getStockStatus(2, lowThresh, minInc)).toBe("low_stock");
    // 2 yd => 8 units
    expect(getStockStatus(8, lowThresh, minInc)).toBe("in_stock");
  });

  test("backorder decisions", () => {
    // Positive ATS => allowed regardless of policy
    expect(decideBackorder("deny", 1).allowed).toBe(true);
    // Zero ATS => policy decides
    expect(decideBackorder("deny", 0)).toEqual({ allowed: false, reason: "Backorders disabled" });
    expect(decideBackorder("allow_any", 0).allowed).toBe(true);
    expect(decideBackorder("allow_date", 0).allowed).toBe(true);
  });
});

