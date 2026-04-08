-- 012_add_warehouseId_to_logs.sql
-- Add warehouseId column to logs table for data isolation

ALTER TABLE logs ADD COLUMN warehouseId TEXT;
