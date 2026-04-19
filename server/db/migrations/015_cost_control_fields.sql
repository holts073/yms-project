-- v3.17.0: Strategic Cost Control Fields
-- 1. Add freeTimeDays to deliveries for Demurrage Calculation
ALTER TABLE deliveries ADD COLUMN freeTimeDays REAL DEFAULT 0;

-- 2. Add freeTimeDays to yms_deliveries
ALTER TABLE yms_deliveries ADD COLUMN freeTimeDays REAL DEFAULT 0;
