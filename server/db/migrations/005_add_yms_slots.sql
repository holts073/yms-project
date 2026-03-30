-- 005_smart_capacity_and_slots.sql
-- Adds the yms_slots table for v3.9.0 Internal Slot Management.
-- Also extends yms_warehouses with pallet-based capacity settings.

CREATE TABLE IF NOT EXISTS yms_slots (
  id TEXT PRIMARY KEY,
  warehouseId TEXT NOT NULL,
  dockId INTEGER NOT NULL,
  deliveryId TEXT NOT NULL,
  startTime TEXT NOT NULL, -- ISO String (YYYY-MM-DDTHH:mm:00.000Z)
  endTime TEXT NOT NULL,   -- ISO String (YYYY-MM-DDTHH:mm:00.000Z)
  FOREIGN KEY(deliveryId) REFERENCES yms_deliveries(id) ON DELETE CASCADE,
  FOREIGN KEY(dockId, warehouseId) REFERENCES yms_docks(id, warehouseId) ON DELETE CASCADE
);

-- Extend yms_warehouses with capacity parameters
-- We use ALTER TABLE since the table already exists.
-- Adding columns with defaults (sqlite doesn't support multiple columns in one ALTER TABLE)
ALTER TABLE yms_warehouses ADD COLUMN fastLaneThreshold INTEGER DEFAULT 12;
ALTER TABLE yms_warehouses ADD COLUMN minutesPerPallet INTEGER DEFAULT 2;
ALTER TABLE yms_warehouses ADD COLUMN baseUnloadingTime INTEGER DEFAULT 15;

-- Index for fast lookup by warehouse and dock
CREATE INDEX IF NOT EXISTS idx_yms_slots_lookup ON yms_slots(warehouseId, dockId);
CREATE INDEX IF NOT EXISTS idx_yms_slots_delivery ON yms_slots(deliveryId);
