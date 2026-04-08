-- 013_add_warehouseId_to_deliveries.sql
-- Adds warehouseId to deliveries table for logistics routing

ALTER TABLE deliveries ADD COLUMN warehouseId TEXT DEFAULT 'W01';

-- Update indices
CREATE INDEX IF NOT EXISTS idx_deliveries_warehouseId ON deliveries(warehouseId);
