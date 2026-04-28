-- 016_add_pallet_exchange_persistence.sql
-- Add pallet exchange tracking fields to both main and YMS deliveries

-- Main deliveries
ALTER TABLE deliveries ADD COLUMN palletsExchanged INTEGER DEFAULT 0;
ALTER TABLE deliveries ADD COLUMN isPalletExchangeConfirmed INTEGER DEFAULT 0; -- 0=false, 1=true

-- YMS deliveries
ALTER TABLE yms_deliveries ADD COLUMN palletsExchanged INTEGER DEFAULT 0;
ALTER TABLE yms_deliveries ADD COLUMN isPalletExchangeConfirmed INTEGER DEFAULT 0; -- 0=false, 1=true
