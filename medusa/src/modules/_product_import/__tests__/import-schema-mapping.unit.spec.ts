import { z } from "zod";
import { productRowSchema, productRowWithRulesSchema, ProductRow } from "../schemas";
import { rowToProductInput } from "../mapping";

describe("Product Import – Fabric Inventory Fields", () => {
  test("schema accepts new fields and enforces min_cut multiple of min_increment", () => {
    const ok = productRowWithRulesSchema.safeParse({
      title: "Linen",
      status: "published",
      uom: "yard",
      min_increment: 0.25,
      min_cut: 1,
    });
    expect(ok.success).toBe(true);

    const bad = productRowWithRulesSchema.safeParse({
      title: "Silk",
      status: "published",
      uom: "yard",
      min_increment: 0.3,
      min_cut: 1,
    });
    expect(bad.success).toBe(false);
  });

  test("mapping attaches inventory metadata to product", () => {
    const row: ProductRow = {
      title: "Cotton",
      status: "published" as any,
      uom: "yard",
      min_increment: 0.25,
      min_cut: 1,
      low_stock_threshold: 1.5,
    } as any;

    const { product } = rowToProductInput(row, {});
    expect(product.metadata).toBeDefined();
    const inv = (product.metadata as any).inventory;
    expect(inv).toBeDefined();
    expect(inv.uom).toBe("yard");
    expect(inv.min_increment).toBe(0.25);
    expect(inv.min_cut).toBe(1);
    expect(inv.low_stock_threshold).toBe(1.5);
  });
});

