-- 004_add_pallet_rate.sql
-- Adds the pallet_rate column to the address_book table for v3.8.0 Ledger calculations.

ALTER TABLE address_book ADD COLUMN pallet_rate REAL DEFAULT 0.00;
