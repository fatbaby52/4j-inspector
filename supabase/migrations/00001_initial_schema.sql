-- 4J Inspector Database Schema
-- Migration: 00001_initial_schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    company TEXT DEFAULT '4J Construction',
    role TEXT DEFAULT 'inspector' CHECK (role IN ('inspector', 'admin', 'reviewer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INSPECTIONS TABLE
-- ============================================
CREATE TABLE public.inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Type and status
    type TEXT NOT NULL CHECK (type IN ('home', 'facility')),
    status TEXT NOT NULL DEFAULT 'field-draft' CHECK (status IN (
        'field-draft', 'field-complete', 'review-in-progress', 'review-complete', 'report-generated'
    )),

    -- Inspector info
    inspector_id UUID NOT NULL REFERENCES public.profiles(id),
    inspector_name TEXT NOT NULL,
    inspector_signature TEXT, -- Base64 data URL
    inspection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Client info (JSONB)
    client_info JSONB NOT NULL DEFAULT '{
        "name": "",
        "company": "",
        "email": "",
        "phone": ""
    }'::jsonb,

    -- Property address (JSONB)
    property_address JSONB NOT NULL DEFAULT '{
        "street": "",
        "city": "",
        "state": "",
        "zip": ""
    }'::jsonb,

    -- Building data (JSONB)
    building_data JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Observations (JSONB - keyed by itemId)
    observations JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- AI-generated content
    executive_summary JSONB, -- { text, reviewStatus, revisionHistory, lastFeedback }
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of recommendations

    -- Report
    report_storage_key TEXT,
    report_url TEXT,

    -- Sync tracking
    version INTEGER NOT NULL DEFAULT 1,
    last_edited_by_device_id TEXT,
    last_edited_by_device_type TEXT CHECK (last_edited_by_device_type IN ('mobile', 'desktop')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    field_completed_at TIMESTAMPTZ,
    review_completed_at TIMESTAMPTZ,
    report_generated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Inspections policies
CREATE POLICY "Users can view own inspections"
    ON public.inspections FOR SELECT
    USING (auth.uid() = inspector_id);

CREATE POLICY "Users can insert own inspections"
    ON public.inspections FOR INSERT
    WITH CHECK (auth.uid() = inspector_id);

CREATE POLICY "Users can update own inspections"
    ON public.inspections FOR UPDATE
    USING (auth.uid() = inspector_id);

CREATE POLICY "Users can delete own inspections"
    ON public.inspections FOR DELETE
    USING (auth.uid() = inspector_id);

-- Indexes
CREATE INDEX idx_inspections_inspector ON public.inspections(inspector_id);
CREATE INDEX idx_inspections_status ON public.inspections(status);
CREATE INDEX idx_inspections_updated ON public.inspections(updated_at DESC);

-- ============================================
-- PHOTOS TABLE
-- ============================================
CREATE TABLE public.photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
    observation_id TEXT NOT NULL,

    -- Storage
    storage_key TEXT, -- Supabase Storage path
    storage_url TEXT, -- Public/signed URL
    thumbnail_key TEXT,
    thumbnail_url TEXT,

    -- Metadata
    caption TEXT,
    original_size INTEGER,
    compressed_size INTEGER,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Photos policies (via inspection ownership)
CREATE POLICY "Users can view photos of own inspections"
    ON public.photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.inspections
            WHERE inspections.id = photos.inspection_id
            AND inspections.inspector_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert photos to own inspections"
    ON public.photos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.inspections
            WHERE inspections.id = photos.inspection_id
            AND inspections.inspector_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete photos from own inspections"
    ON public.photos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.inspections
            WHERE inspections.id = photos.inspection_id
            AND inspections.inspector_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_photos_inspection ON public.photos(inspection_id);
CREATE INDEX idx_photos_observation ON public.photos(observation_id);

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'inspection-photos',
    'inspection-photos',
    false,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload to own inspection folders"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'inspection-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own inspection photos"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'inspection-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own inspection photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'inspection-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- REPORTS STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'inspection-reports',
    'inspection-reports',
    false,
    104857600, -- 100MB
    ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Reports storage policies
CREATE POLICY "Users can view own reports"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'inspection-reports'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inspections_updated_at
    BEFORE UPDATE ON public.inspections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
