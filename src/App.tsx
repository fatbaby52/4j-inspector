// App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Navigation } from '@/components/layout/Navigation';

// Pages - Field Collection
import { Home } from '@/pages/Home';
import { NewInspection } from '@/pages/NewInspection';
import { InspectionList } from '@/pages/InspectionList';
import { InspectionChecklist } from '@/pages/InspectionChecklist';
import { CategoryDetail } from '@/pages/CategoryDetail';
import { Settings } from '@/pages/Settings';
import { ClientInfo } from '@/pages/ClientInfo';
import { PropertyInfo } from '@/pages/PropertyInfo';
import { BuildingData } from '@/pages/BuildingData';
import { PhotoCapture } from '@/pages/PhotoCapture';
import { FieldComplete } from '@/pages/FieldComplete';

// Pages - Desktop Review
import { DesktopReview } from '@/pages/DesktopReview';
import { NoteReview } from '@/pages/NoteReview';
import { SummaryReview } from '@/pages/SummaryReview';
import { RecommendationsReview } from '@/pages/RecommendationsReview';
import { FinalReview } from '@/pages/FinalReview';
import { ReportGeneration } from '@/pages/ReportGeneration';

// Pages - Auth
import { Login } from '@/pages/Login';

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Main Navigation */}
          <Route path="/" element={<Home />} />
          <Route path="/inspections" element={<InspectionList />} />
          <Route path="/settings" element={<Settings />} />

          {/* New Inspection */}
          <Route path="/new-inspection" element={<NewInspection />} />

          {/* Inspection Detail Routes */}
          <Route path="/inspection/:id" element={<InspectionChecklist />} />
          <Route
            path="/inspection/:id/category/:categoryId"
            element={<CategoryDetail />}
          />

          {/* Field Data Collection */}
          <Route path="/inspection/:id/client" element={<ClientInfo />} />
          <Route path="/inspection/:id/property" element={<PropertyInfo />} />
          <Route path="/inspection/:id/building" element={<BuildingData />} />
          <Route path="/inspection/:id/complete" element={<FieldComplete />} />

          {/* Photo Capture */}
          <Route
            path="/inspection/:id/category/:categoryId/item/:itemId/photos"
            element={<PhotoCapture />}
          />

          {/* Desktop Review Routes */}
          <Route path="/inspection/:id/review" element={<DesktopReview />} />
          <Route path="/inspection/:id/review/notes" element={<NoteReview />} />
          <Route path="/inspection/:id/review/summary" element={<SummaryReview />} />
          <Route path="/inspection/:id/review/recommendations" element={<RecommendationsReview />} />
          <Route path="/inspection/:id/review/final" element={<FinalReview />} />
          <Route path="/inspection/:id/report" element={<ReportGeneration />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Bottom Navigation */}
        <Navigation />
      </AppShell>
    </BrowserRouter>
  );
}

// Temporary placeholder component for routes not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <span className="text-6xl mb-4 block">🚧</span>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500">This page is coming soon</p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

export default App;
