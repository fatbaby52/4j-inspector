# Supabase Backend Setup

This directory contains the Supabase configuration for the 4J Inspector app.

## Prerequisites

1. Install Supabase CLI: `npm install -g supabase`
2. Create a Supabase project at https://supabase.com
3. Get your project credentials from Settings > API

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For Edge Functions, set these in the Supabase Dashboard (Settings > Edge Functions):

```
OPENAI_API_KEY=sk-your-openai-key
```

## Database Setup

### Option 1: Using Supabase CLI (Recommended)

```bash
# Link to your project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

### Option 2: Manual SQL

1. Go to Supabase Dashboard > SQL Editor
2. Copy and paste the contents of `migrations/00001_initial_schema.sql`
3. Run the SQL

## Edge Functions Deployment

```bash
# Deploy all functions
supabase functions deploy ai-cleanup-note
supabase functions deploy ai-executive-summary
supabase functions deploy ai-recommendations
supabase functions deploy generate-pdf
```

## Storage Buckets

The migration automatically creates:
- `inspection-photos` - For inspection photos (50MB limit)
- `inspection-reports` - For generated PDF reports (100MB limit)

## Row Level Security (RLS)

All tables have RLS enabled. Users can only:
- View their own profile
- CRUD their own inspections
- Access photos/reports for their own inspections

## Testing Locally

```bash
# Start local Supabase
supabase start

# Run Edge Functions locally
supabase functions serve
```

## Schema Overview

### Tables

- **profiles** - User profiles (extends auth.users)
- **inspections** - Main inspection data (JSONB for flexible structure)
- **photos** - Photo metadata and storage references

### Key Fields in `inspections`

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| type | TEXT | 'home' or 'facility' |
| status | TEXT | Inspection workflow status |
| inspector_id | UUID | References profiles |
| client_info | JSONB | Client details |
| property_address | JSONB | Property address |
| building_data | JSONB | Building characteristics |
| observations | JSONB | Keyed by item ID |
| executive_summary | JSONB | AI-generated summary |
| recommendations | JSONB | Array of recommendations |

## Edge Functions

| Function | Purpose |
|----------|---------|
| ai-cleanup-note | Polishes raw field notes |
| ai-executive-summary | Generates report summary |
| ai-recommendations | Generates prioritized recommendations |
| generate-pdf | Creates PDF report |

All AI functions use GPT-4o-mini for cost efficiency.
