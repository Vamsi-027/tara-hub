-- Orders Table Schema
-- Production-ready schema for storing customer orders

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_intent_id VARCHAR(255),

  -- Order items stored as JSONB for flexibility
  items JSONB NOT NULL DEFAULT '[]',

  -- Shipping information
  shipping_address JSONB NOT NULL DEFAULT '{}',

  -- Totals
  subtotal INTEGER NOT NULL DEFAULT 0, -- Store in cents
  shipping_cost INTEGER NOT NULL DEFAULT 0,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,

  -- Tracking
  tracking_number VARCHAR(255),

  -- Metadata
  notes JSONB DEFAULT '[]',
  timeline JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes for performance
  INDEX idx_customer_email (customer_email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_payment_intent (payment_intent_id)
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Order events table for audit trail
CREATE TABLE IF NOT EXISTS order_events (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_order_events_order_id (order_id),
  INDEX idx_order_events_type (event_type),
  INDEX idx_order_events_created_at (created_at)
);

-- Customer order summary view for analytics
CREATE OR REPLACE VIEW customer_order_summary AS
SELECT
  customer_email,
  COUNT(*) as total_orders,
  SUM(total_amount) as total_spent,
  AVG(total_amount) as avg_order_value,
  MAX(created_at) as last_order_date,
  MIN(created_at) as first_order_date
FROM orders
WHERE status NOT IN ('cancelled', 'failed')
GROUP BY customer_email;