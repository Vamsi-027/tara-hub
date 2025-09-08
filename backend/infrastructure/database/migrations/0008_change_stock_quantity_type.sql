-- Change stock_quantity from integer to numeric to allow decimal values
ALTER TABLE fabrics ALTER COLUMN stock_quantity TYPE NUMERIC(10,2);