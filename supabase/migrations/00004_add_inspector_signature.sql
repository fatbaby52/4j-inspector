-- Migration: 00004_add_inspector_signature
-- Add inspector_signature column to inspections table (base64 data URL)

ALTER TABLE public.inspections
ADD COLUMN IF NOT EXISTS inspector_signature TEXT;
