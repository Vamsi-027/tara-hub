Inventory: Manual Stock Setup (Main Warehouse)

Steps in Admin UI:
- Find the product variant:
  - Go to Products, open the product, and locate the variant you want to stock.
- Open Inventory/Locations:
  - In the variant view, open the Inventory section (or Locations/Stock if using the new Admin UI).
- Assign stock location:
  - Ensure "Main Warehouse" is present. If not, run the seed script or create the location in Admin.
- Set stocked quantity:
  - Enter the on-hand quantity for "Main Warehouse" and save.
- Verify availability:
  - The available quantity becomes stocked minus reservations.
- Reservations on order:
  - When orders are placed, reservations reduce available quantity automatically (stocked remains the same until shipment/adjustment).

CLI helpers:
- Seed the stock location:
  - `npx medusa exec ./src/scripts/seed-main-warehouse.ts`

