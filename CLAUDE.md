# 4J Construction Property Inspection App

## Project Overview

A Progressive Web App (PWA) for property inspections built for 4J Construction. Allows inspectors to collect data on-site (iPad, offline-capable), review with AI assistance at desk, and generate professional PDF reports.

## Tech Stack

- **Frontend**: React 18+ / TypeScript / Vite / Tailwind CSS
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Local Storage**: Dexie.js (IndexedDB)
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **AI**: OpenAI GPT-4o via Edge Function proxy
- **PDF**: pdf-lib (server-side generation in Edge Function)

## Two-Phase Workflow

### Phase 1: Field Collection (iPad, Offline)
1. Client & Property Information
2. Front facade photo
3. Building characteristics
4. Walk through categories capturing observations (grade, photos, notes)
5. Field Complete checklist confirmation
6. Mark as "Field Complete" → triggers sync

### Phase 2: Desktop Review (Desktop, Online)
1. AI Note Cleanup - Polish raw field notes
2. AI Executive Summary generation
3. AI Recommendations - Prioritized action items
4. Final Review with signature
5. PDF Generation

## Status Flow
```
field-draft → field-complete → review-in-progress → review-complete → report-generated
    │              │                   │                   │                │
    └── iPad ──────┘                   └───── Desktop ─────┴────────────────┘
```

## Key Directories

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication (AuthGuard, AuthProvider)
│   ├── common/         # Button, Card, GradeSelector, TextField, etc.
│   ├── inspection/     # ObservationCard, PhotoGallery, NoteInput, etc.
│   ├── review/         # AI review panels, cleanup cards
│   ├── report/         # PDF generation UI
│   ├── sync/           # Sync status, queue management
│   └── layout/         # AppShell, Header, Navigation, DeviceGate
├── pages/              # Route pages
├── hooks/              # Custom React hooks
├── stores/             # Zustand state stores
├── services/           # API services (supabase, ai, pdf, sync)
├── db/                 # IndexedDB/Dexie configuration
├── types/              # TypeScript type definitions
└── data/               # Static data (inspection categories, building options)

supabase/
├── functions/          # Edge Functions
│   ├── generate-pdf/   # Server-side PDF generation using pdf-lib
│   ├── ai-cleanup-note/
│   ├── ai-executive-summary/
│   ├── ai-recommendations/
│   └── _shared/        # Shared utilities (cors, openai, pdfHelpers)
└── migrations/         # Database schema
```

## PDF Generation

### Architecture
- **Server-side generation** using `pdf-lib` in Supabase Edge Function
- Produces proper vector PDFs with selectable text
- Handles page breaks automatically
- Embeds photos directly from Supabase Storage

### Key Files
- `supabase/functions/generate-pdf/index.ts` - Main PDF generation logic
- `supabase/functions/_shared/pdfHelpers.ts` - Reusable drawing functions

### Report Sections
1. **Cover Page** - Blue background, property address, client, inspector, date
2. **Property Information** - Two-column layout with address and client details
3. **Building Data** - Property type, year built, size, foundation, roof, etc.
4. **Executive Summary** - AI-generated summary in blue-bordered box
5. **Inspection Findings** - Color-coded observations (green/yellow/red) by category
6. **Photo Gallery** - 2-column grid of all photos with captions
7. **Recommendations** - Priority-sorted cards (HIGH/MEDIUM/LOW)
8. **Inspector Certification** - Signature line and certification text
9. **Footer** - Report ID and generation date

### Deploying PDF Changes
```bash
cd supabase
supabase functions deploy generate-pdf
```

## Inspection Categories

- Exterior (foundation, grading, driveways, decks, walls, windows, doors)
- Interior (walls/ceilings, floors, stairs, doors, windows, appliances)
- Roofing (material, gutters, flashing, skylights/chimneys)
- Plumbing (supply line, water heater, hose bibs, fixtures)
- Electrical (panel, subpanels, breakers, wiring, fixtures, GFCI)
- HVAC (heating, venting, cooling, thermostat)
- Insulation & Ventilation (attic, crawlspace, vapor barriers)
- Fireplaces & Fuel Burning
- Safety (smoke/CO detectors, security)

## Environment Variables

```env
# .env.local (frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Supabase Edge Functions (set via CLI)
OPENAI_API_KEY=your_openai_key
```

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint

# Supabase
supabase functions serve   # Local Edge Functions
supabase db push          # Push migrations
supabase functions deploy  # Deploy Edge Functions
```

## Photo Handling

- Maximum ~100 photos per inspection
- Compressed on capture: 1920px max dimension, 80% JPEG quality
- Thumbnails generated for UI
- Storage warnings at 75 and 100 photos

## Notes for Development

- Use Python for file operations on Windows (bash has path issues)
- Device enforcement: iPad for field work, Desktop for review
- Offline-first: All data persists in IndexedDB
- Sync: Manual "Sync Now" button + auto-sync on app open/resume
- PDF uses Helvetica (built-in) fonts for reliable rendering
