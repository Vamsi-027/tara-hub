import { model } from "@medusajs/framework/utils"

const Tenant = model.define("tenant", {
  id: model.id({ prefix: "tenant" }).primaryKey(),
  name: model.text().searchable(),
  domain: model.text().unique(),
  subdomain: model.text().unique().nullable(),
  
  store_id: model.text().searchable(),
  store_name: model.text().searchable(),
  store_currency: model.text().default("USD"),
  
  email: model.text(),
  phone: model.text().nullable(),
  
  settings: model.json().default({}),
  
  is_active: model.boolean().default(true),
  is_premium: model.boolean().default(false),
  
  // Timestamps
  created_at: model.dateTime().default("now"),
  updated_at: model.dateTime().default("now"),
  deleted_at: model.dateTime().nullable(),
}).indexes([
  {
    name: "IDX_tenant_domain",
    on: ["domain"],
  },
  {
    name: "IDX_tenant_subdomain", 
    on: ["subdomain"],
  },
  {
    name: "IDX_tenant_store_id",
    on: ["store_id"],
  },
])

export default Tenant