// pages/DesktopReview.tsx

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { useInspectionStore } from '@/stores/inspectionStore';
import { useDeviceType } from '@/hooks/useDeviceType';
import { inspectionCategories } from '@/data/inspectionCategories';

export function DesktopReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentInspection, loadInspection, startReview, isLoading } = useInspectionStore();
  const { isDesktop } = useDeviceType();

  // Load inspection if not already loaded
  useEffect(() => {
    if (id && !currentInspection) {
      loadInspection(id);
    }
  }, [id, currentInspection, loadInspection]);

  // Start review if coming from field-complete
  useEffect(() => {
    if (currentInspection?.status === 'field-complete') {
      startReview();
    }
  }, [currentInspection?.status, startReview]);

  if (isLoading || !currentInspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  // Count notes and observations
  let totalNotes = 0;
  let pendingNotes = 0;
  let totalObservations = 0;

  Object.values(currentInspection.observations).forEach((obs) => {
    obs.forEach((o) => {
      totalObservations++;
      o.notes.forEach((n) => {
        totalNotes++;
        if (n.reviewStatus === 'pending') pendingNotes++;
      });
    });
  });

  const summaryStatus = currentInspection.executiveSummary?.reviewStatus || 'pending';
  const recommendationsCount = currentInspection.recommendations.length;
  const pendingRecommendations = currentInspection.recommendations.filter(
    (r) => r.reviewStatus === 'pending'
  ).length;

  // Review steps
  const steps = [
    {
      id: 'notes',
      title: 'Review Notes',
      description: 'AI polishes your field notes into professional language',
      status: pendingNotes > 0 ? 'pending' : totalNotes > 0 ? 'complete' : 'empty',
      stats: `${totalNotes - pendingNotes}/${totalNotes} reviewed`,
      path: `/inspection/${id}/review/notes`,
      icon: '📝',
    },
    {
      id: 'summary',
      title: 'Executive Summary',
      description: 'AI generates a professional summary of findings',
      status: summaryStatus === 'pending' ? 'pending' : 'complete',
      stats: summaryStatus === 'pending' ? 'Not generated' : 'Ready',
      path: `/inspection/${id}/review/summary`,
      icon: '📋',
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      description: 'AI suggests prioritized action items',
      status: pendingRecommendations > 0 ? 'pending' : recommendationsCount > 0 ? 'complete' : 'empty',
      stats: recommendationsCount > 0
        ? `${recommendationsCount - pendingRecommendations}/${recommendationsCount} reviewed`
        : 'Not generated',
      path: `/inspection/${id}/review/recommendations`,
      icon: '💡',
    },
    {
      id: 'final',
      title: 'Final Review',
      description: 'Add signature and generate PDF report',
      status: currentInspection.inspectorSignature ? 'complete' : 'pending',
      stats: currentInspection.inspectorSignature ? 'Signed' : 'Awaiting signature',
      path: `/inspection/${id}/review/final`,
      icon: '✍️',
    },
  ];

  // Check if all steps are complete
  const allComplete = steps.every((s) => s.status === 'complete');

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header title="Desktop Review" showBack backTo="/inspections" />

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Device warning for mobile */}
        {!isDesktop && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent>
              <div className="flex items-center gap-3">
                <span className="text-2xl">💻</span>
                <div>
                  <h4 className="font-medium text-yellow-900">Desktop Recommended</h4>
                  <p className="text-sm text-yellow-700">
                    The review phase works best on a desktop or laptop for easier editing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inspection Summary */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {currentInspection.propertyAddress.street}
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              {currentInspection.propertyAddress.city}, {currentInspection.propertyAddress.state}
            </p>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-500">Client:</span>{' '}
                <span className="font-medium">{currentInspection.clientInfo.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>{' '}
                <span className="font-medium">
                  {new Date(currentInspection.inspectionDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="mt-3 text-sm">
              <span className="text-gray-500">Observations:</span>{' '}
              <span className="font-medium">{totalObservations}</span>
              <span className="mx-2">•</span>
              <span className="text-gray-500">Notes:</span>{' '}
              <span className="font-medium">{totalNotes}</span>
            </div>
          </CardContent>
        </Card>

        {/* Review Steps */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Review Steps
          </h3>

          {steps.map((step, index) => (
            <Card
              key={step.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                step.status === 'complete' ? 'border-green-200' : ''
              }`}
              onClick={() => navigate(step.path)}
            >
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{step.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{index + 1}.</span>
                      <h4 className="font-medium text-gray-900">{step.title}</h4>
                      {step.status === 'complete' && (
                        <span className="text-green-500">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{step.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{step.stats}</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900">Review Progress</h4>
              <span className="text-sm text-blue-700">
                {steps.filter((s) => s.status === 'complete').length}/{steps.length} complete
              </span>
            </div>
            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${(steps.filter((s) => s.status === 'complete').length / steps.length) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="max-w-2xl mx-auto">
          {allComplete ? (
            <Button
              fullWidth
              onClick={() => navigate(`/inspection/${id}/report`)}
            >
              Generate PDF Report
            </Button>
          ) : (
            <Button
              fullWidth
              onClick={() => navigate(steps.find((s) => s.status !== 'complete')?.path || steps[0].path)}
            >
              Continue Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DesktopReview;
