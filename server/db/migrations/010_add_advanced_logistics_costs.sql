-- v3.12.0: Modular Finance & Incoterm Integration
-- 1. Add Incoterm to all delivery tables (deliveries already has it in 001)
ALTER TABLE yms_deliveries ADD COLUMN incoterm TEXT DEFAULT 'EXW';

-- 2. Add Detailed Logistics Costs (Financial)
ALTER TABLE deliveries ADD COLUMN demurrageDailyRate REAL DEFAULT 0;
ALTER TABLE deliveries ADD COLUMN standingTimeCost REAL DEFAULT 0;
ALTER TABLE deliveries ADD COLUMN thcCost REAL DEFAULT 0;
ALTER TABLE deliveries ADD COLUMN customsCost REAL DEFAULT 0;

ALTER TABLE yms_deliveries ADD COLUMN demurrageDailyRate REAL DEFAULT 0;
ALTER TABLE yms_deliveries ADD COLUMN standingTimeCost REAL DEFAULT 0;
ALTER TABLE yms_deliveries ADD COLUMN thcCost REAL DEFAULT 0;
ALTER TABLE yms_deliveries ADD COLUMN customsCost REAL DEFAULT 0;

-- 3. Add Feature Flag for Finance in settings (initialized in app logic or via UPDATE)
-- Settings is a key-value JSON table, managed by saveSetting/getSetting. 
-- No schema change needed for settings themselves.
