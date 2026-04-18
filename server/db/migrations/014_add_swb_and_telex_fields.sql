-- v3.15.0: Inkomend Pipeline & Telex Release Uitbreiding
-- 1. Voeg kolommen toe aan deliveries tabel
ALTER TABLE deliveries ADD COLUMN documentType TEXT DEFAULT 'B/L';
ALTER TABLE deliveries ADD COLUMN telexReleaseStatus TEXT DEFAULT NULL;
ALTER TABLE deliveries ADD COLUMN telexReleaseDate TEXT DEFAULT NULL;
ALTER TABLE deliveries ADD COLUMN telexReleaseReference TEXT DEFAULT NULL;
ALTER TABLE deliveries ADD COLUMN telexReleasedBy TEXT DEFAULT NULL;
ALTER TABLE deliveries ADD COLUMN shippingLine TEXT DEFAULT NULL;
ALTER TABLE deliveries ADD COLUMN vesselName TEXT DEFAULT NULL;
ALTER TABLE deliveries ADD COLUMN voyageNumber TEXT DEFAULT NULL;
ALTER TABLE deliveries ADD COLUMN portOfDischarge TEXT DEFAULT NULL;
ALTER TABLE deliveries ADD COLUMN containerSealNumber TEXT DEFAULT NULL;
ALTER TABLE deliveries ADD COLUMN customsDeclarationNumber TEXT DEFAULT NULL;
ALTER TABLE deliveries ADD COLUMN customsClearedDate TEXT DEFAULT NULL;

-- 2. Voeg dezelfde kolommen toe aan de archief-tabel (yms_deliveries) indien nodig voor consistentie
ALTER TABLE yms_deliveries ADD COLUMN documentType TEXT DEFAULT 'B/L';
ALTER TABLE yms_deliveries ADD COLUMN telexReleaseStatus TEXT DEFAULT NULL;
ALTER TABLE yms_deliveries ADD COLUMN telexReleaseDate TEXT DEFAULT NULL;
ALTER TABLE yms_deliveries ADD COLUMN telexReleaseReference TEXT DEFAULT NULL;
ALTER TABLE yms_deliveries ADD COLUMN telexReleasedBy TEXT DEFAULT NULL;
ALTER TABLE yms_deliveries ADD COLUMN shippingLine TEXT DEFAULT NULL;
ALTER TABLE yms_deliveries ADD COLUMN vesselName TEXT DEFAULT NULL;
ALTER TABLE yms_deliveries ADD COLUMN voyageNumber TEXT DEFAULT NULL;
ALTER TABLE yms_deliveries ADD COLUMN portOfDischarge TEXT DEFAULT NULL;
ALTER TABLE yms_deliveries ADD COLUMN containerSealNumber TEXT DEFAULT NULL;
ALTER TABLE yms_deliveries ADD COLUMN customsDeclarationNumber TEXT DEFAULT NULL;
ALTER TABLE yms_deliveries ADD COLUMN customsClearedDate TEXT DEFAULT NULL;
