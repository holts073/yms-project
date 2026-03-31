-- 008_add_qa_flag.sql
-- Adds the requiresQA column to both deliveries and yms_deliveries.

ALTER TABLE deliveries ADD COLUMN requiresQA INTEGER DEFAULT 0;
ALTER TABLE yms_deliveries ADD COLUMN requiresQA INTEGER DEFAULT 0;
