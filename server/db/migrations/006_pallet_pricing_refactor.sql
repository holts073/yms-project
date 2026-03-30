-- 006_pallet_pricing_refactor.sql
-- Refactors pallet pricing from static supplier rate to dynamic per-delivery rates.
-- Supports multi-type (EUR, CHEP, DPD, BLOK) and historical tracking.

-- 1. Add palletRate to main deliveries table
-- Note: palletType already exists in deliveries as TEXT
ALTER TABLE deliveries ADD COLUMN palletRate REAL DEFAULT 0.00;

-- 2. Add palletType and palletRate to yms_deliveries table
ALTER TABLE yms_deliveries ADD COLUMN palletType TEXT DEFAULT 'EUR';
ALTER TABLE yms_deliveries ADD COLUMN palletRate REAL DEFAULT 0.00;

-- 3. Add palletType and palletRate to pallet_transactions table
-- This captures the rate and type AT THE TIME of the transaction.
ALTER TABLE pallet_transactions ADD COLUMN palletType TEXT;
ALTER TABLE pallet_transactions ADD COLUMN palletRate REAL;
