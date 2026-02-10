-- Migration: 00003_add_facade_photo
-- Add facade_photo_id column to inspections table

ALTER TABLE public.inspections
ADD COLUMN IF NOT EXISTS facade_photo_id UUID;
