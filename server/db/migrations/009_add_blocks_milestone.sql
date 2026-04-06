-- Migration: 009 Add Blocks Milestone to Documents
-- Description: Adds a column to specify which milestone a document blocks.
-- Author: @System-Architect
-- Date: 2026-03-31

ALTER TABLE documents ADD COLUMN blocksMilestone INTEGER DEFAULT 100;

-- Update existing mandatory documents to block milestone 100 if not specified
UPDATE documents SET blocksMilestone = 100 WHERE required = 1 AND blocksMilestone IS NULL;
