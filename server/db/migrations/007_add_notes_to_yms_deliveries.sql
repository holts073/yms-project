-- 007_add_notes_to_yms_deliveries.sql
-- Adds a notes column to the yms_deliveries table for flexibility.

ALTER TABLE yms_deliveries ADD COLUMN notes TEXT;
