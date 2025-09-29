---
description: Analyze business metrics and generate insights for fabric marketplace
argument-hint: [metric-type]
allowed-tools: Bash, Read, Grep
---

# Business Metrics Analysis

Analyze business metrics: ${1:-all}

## Available Metrics:

### 1. Revenue & Financial
```sql
-- Revenue by period
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as order_count,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value
FROM orders
WHERE status = 'completed'
GROUP BY month
ORDER BY month DESC;
```

### 2. Customer Segmentation
- Fashion designers (medium orders, seasonal)
- Manufacturers (large orders, regular)
- Retailers (medium orders, seasonal)
- Hobbyists (small orders, occasional)

Analyze:
- Customer lifetime value by segment
- Repeat purchase rate
- Acquisition cost per segment

### 3. Inventory Performance
```sql
-- Inventory turnover
SELECT
  m.name,
  SUM(order_items.quantity) as units_sold,
  AVG(m.inventory_quantity) as avg_inventory,
  (SUM(order_items.quantity) / AVG(m.inventory_quantity)) as turnover_rate
FROM materials m
LEFT JOIN order_items ON m.id = order_items.material_id
GROUP BY m.id, m.name
ORDER BY turnover_rate DESC;
```

### 4. Product Catalog Performance
- Best-selling fabrics by fiber type
- Price elasticity analysis
- Seasonal trend analysis
- Material availability impact on sales

### 5. Operational Efficiency
- Order fulfillment time
- Stockout rate
- Return/refund rate
- Customer support tickets

## Reporting:

Generate insights on:
1. **Growth Opportunities**: Underserved customer segments
2. **Inventory Optimization**: Slow-moving vs fast-moving items
3. **Pricing Strategy**: Margin analysis by product category
4. **Customer Retention**: Churn rate and retention initiatives

Use fabric-store-business-expert agent for deep business analysis.