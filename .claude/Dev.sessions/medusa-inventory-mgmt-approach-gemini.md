
# Medusa.js v2: Inventory Management Implementation Strategy

**Author:** Gemini, Medusa.js Architect
**Date:** 2025-09-19
**Status:** Proposed

## 1. Executive Summary

This document outlines the architectural approach for implementing a robust and scalable Inventory Management system for the Tara Hub e-commerce platform. The current Medusa.js v2 implementation relies on the legacy (v1) inventory model, which lacks multi-location support and the granularity required for a growing SMB.

The recommended strategy is to **migrate to and build upon the official Medusa v2 Inventory and Stock Location modules** (`@medusajs/inventory-next` and `@medusajs/stock-location-next`). This will establish a modern foundation for real-time inventory tracking, multi-warehouse management, and future extensions like supplier integration and advanced reporting.

## 2. Current State Analysis

A review of the existing codebase (`package.json`, `medusa-config.ts`) reveals:
- The project uses `@medusajs/medusa` v2.10.0.
- The v2 Inventory and Stock Location modules are **not** currently installed or configured.
- The system is implicitly using the default v1 inventory system, where inventory levels are stored directly on the `ProductVariant`.
- Custom modules for `materials` and `fabric_products` exist, indicating a need for domain-specific product and inventory logic.

This legacy setup is a bottleneck for growth, as it cannot differentiate inventory across multiple physical or virtual locations (e.g., "Main Warehouse," "Retail Showroom," "Supplier Stock").

## 3. Recommended Core Technology

The implementation will be centered around two key Medusa v2 modules:

1.  **`@medusajs/inventory-next`**: The core Inventory module. It decouples inventory from `ProductVariant` into its own `InventoryItem` and `InventoryLevel` entities. This allows a single `InventoryItem` (e.g., "Emerald Green Velvet") to have its stock levels tracked across multiple locations.
2.  **`@medusajs/stock-location-next`**: Manages the physical or logical locations where inventory is stored. It integrates with the Inventory module to provide the multi-warehouse capabilities.

## 4. Implementation Phases

### Phase 1: Foundation - Module Installation & Migration

1.  **Install Modules:** Add the required packages to the Medusa backend.
    ```bash
    npm install @medusajs/inventory-next @medusajs/stock-location-next
    ```
2.  **Update Configuration:** Register the new modules in `medusa-config.ts`. This is a critical step to activate the new inventory engine.
    ```typescript
    // In medusa-config.ts
    import { Modules } from "@medusajs/modules-sdk"

    // ... inside defineConfig({ modules: [ ... ] })
    {
      resolve: "@medusajs/inventory-next",
      options: {
        // module options
      },
    },
    {
      resolve: "@medusajs/stock-location-next",
      options: {
        // module options
      },
    },
    ```
3.  **Run Migrations:** Execute the database migrations to create the new tables required by the modules (`inventory_item`, `inventory_level`, `stock_location`, etc.).
    ```bash
    npx medusa db:migrate
    ```
4.  **Data Seeding - Stock Locations:** Create initial stock locations. A script in `src/scripts/` should be created to define the initial business locations.
    *   Example Locations: "Primary Warehouse (US)", "Supplier - Fabricorp", "Showroom (NYC)".

### Phase 2: Data Model Extension & Logic

1.  **Extend Core Entities:** For SMB needs, we must store more data. We will extend the Medusa entities without modifying the core package.
    *   **Extend `InventoryItem`:** Create a new model in `src/models/extended-inventory-item.ts` to add SMB-specific fields.
        *   `bin_location` (string): The shelf/bin where the item is stored in a warehouse.
        *   `supplier_sku` (string): The SKU used by the primary supplier.
        *   `low_stock_threshold` (number): The quantity at which a low-stock warning is triggered.
    *   **Extend `StockLocation`:** Add a `type` field (e.g., 'warehouse', 'retail', 'supplier', 'virtual').

2.  **Custom Service Logic:** Create a custom service in `src/services/inventory-custom.ts` to handle business-specific logic.
    *   **Low-Stock Notifications:** A subscriber that listens for `inventory-item.updated` events. If stock for an item at a location drops below its `low_stock_threshold`, it triggers a custom notification (e.g., using the Resend module) to the purchasing manager.
    *   **Inventory Adjustment Reasons:** When stock levels are changed manually, we need to record *why*. We will create a new `InventoryAdjustment` entity and a service method to log adjustments (`reason`: "Cycle Count," "Damaged Goods," "Initial Stock").

### Phase 3: API Layer (Admin & External)

1.  **Custom Admin API Endpoints:** Expose the new functionality to the admin panel.
    *   `GET /admin/inventory-health`: A new endpoint that returns a summary of all inventory items, their locations, quantities, and stock status (e.g., "In Stock," "Low Stock," "Out of Stock") based on the `low_stock_threshold`.
    *   `POST /admin/inventory/adjust`: An endpoint to perform manual stock adjustments that also logs the reason using the custom `InventoryAdjustment` entity from Phase 2.

### Phase 4: Admin UI Integration

1.  **Create an Admin UI Extension:** Use the `medusa-admin-cli` to create a new widget or page for inventory management.
2.  **Develop the "Inventory Health" Dashboard:**
    *   This page will consume the `GET /admin/inventory-health` endpoint.
    *   It will display a filterable, sortable table of all inventory items.
    *   Columns: Product Title, Variant SKU, Location, Bin Location, Quantity on Hand, Low Stock Threshold, Status.
    *   It should feature a modal triggered from this table to allow for quick, reason-logged stock adjustments via the `POST /admin/inventory/adjust` endpoint.

## 5. Key Considerations

-   **Atomicity:** The Medusa v2 Inventory module uses workflows, ensuring that stock updates during order placement or returns are atomic and reliable. Our custom adjustments must also be wrapped in transactions.
-   **Data Migration:** A one-time script will be required to migrate inventory levels from the old `ProductVariant.inventory_quantity` field to the new `InventoryLevel` tables for each stock location.
-   **User Roles:** Access to the new inventory dashboard and adjustment endpoints should be restricted to specific admin user roles (e.g., "Warehouse Manager," "Admin").

## 6. Next Steps

1.  **Approval:** Seek approval for this architectural plan.
2.  **Phase 1 Implementation:** Begin with the foundational module installation and configuration.
3.  **Backlog Creation:** Create detailed tickets for each item in Phases 2-4.
