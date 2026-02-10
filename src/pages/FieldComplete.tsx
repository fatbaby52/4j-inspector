// pages/FieldComplete.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { useInspectionStore } from '@/stores/inspectionStore';
import { useSync } from '@/hooks/useSync';
import { inspectionCategories } from '@/data/inspectionCategories';

interface ChecklistItem {
  label: string;
  isComplete: boolean;
  isRequired: boolean;
}

export function FieldComplete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentInspection, loadInspection, markFieldComplete, isLoading } =
    useInspectionStore();
  const { sync, isSyncing, hasPendingChanges, isOnline } = useSync();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load inspection if not already loaded
  useEffect(() => {
    if (id && !currentInspection) {
      loadInspection(id);
    }
  }, [id, currentInspection, loadInspection]);

  if (isLoading || !currentInspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  // Build checklist
  const checklistItems: ChecklistItem[] = [
    {
      label: 'Client information entered',
      isComplete: !!(
        currentInspection.clientInfo.name &&
        currentInspection.clientInfo.email &&
        currentInspection.clientInfo.phone
      ),
      isRequired: true,
    },
    {
      label: 'Property address entered',
      isComplete: !!(
        currentInspection.propertyAddress.street &&
        currentInspection.propertyAddress.city
      ),
      isRequired: true,
    },
    {
      label: 'Front facade photo captured',
      isComplete: !!currentInspection.facadePhotoId,
      isRequired: true,
    },
    {
      label: 'Building data completed',
      isComplete: !!(
        currentInspection.buildingData.propertyType &&
        currentInspection.buildingData.yearBuilt
      ),
      isRequired: false,
    },
    ...inspectionCategories.map((cat) => {
      const hasObservations = cat.items.some(
        (item) => (currentInspection.observations[item.id]?.length || 0) > 0
      );
      return {
        label: `${cat.name} inspected`,
        isComplete: hasObservations,
        isRequired: false,
      };
    }),
  ];

  const requiredComplete = checklistItems
    .filter((i) => i.isRequired)
    .every((i) => i.isComplete);

  const completedCount = checklistItems.filter((i) => i.isComplete).length;
  const totalCount = checklistItems.length;

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Mark as field complete
      await markFieldComplete();

      // Try to sync if online
      if (isOnline) {
        await sync();
      }

      // Navigate to inspection list
      navigate('/inspections');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header
        title="Field Complete Checklist"
        showBack
        backTo={`/inspection/${id}`}
      />

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Ready to Complete?
          </h2>
          <p className="text-gray-600">
            Review before marking this inspection as field complete.
          </p>
        </div>

        {/* Checklist */}
        <Card>
          <div className="divide-y">
            {checklistItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4"
              >
                <span
                  className={`
                    text-xl flex-shrink-0
                    ${item.isComplete ? 'text-green-500' : 'text-gray-300'}
                  `}
                >
                  {item.isComplete ? '✓' : '○'}
                </span>
                <span
                  className={`
                    flex-1
                    ${item.isComplete ? 'text-gray-900' : 'text-gray-500'}
                  `}
                >
                  {item.label}
                </span>
                {item.isRequired && !item.isComplete && (
                  <span className="text-xs text-red-500 font-medium">
                    Required
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Progress summary */}
        <div className="text-center text-gray-600">
          <div className="text-2xl font-bold text-primary mb-1">
            {completedCount}/{totalCount}
          </div>
          <p className="text-sm">items complete</p>
        </div>

        {/* Sync status */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <span className="text-green-500">🟢</span>
                    <span className="text-sm text-gray-600">Online</span>
                  </>
                ) : (
                  <>
                    <span className="text-yellow-500">🟡</span>
                    <span className="text-sm text-gray-600">Offline</span>
                  </>
                )}
              </div>

              {hasPendingChanges && (
                <span className="text-sm text-yellow-600">
                  Changes will sync when online
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {!requiredComplete && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm text-center">
              Complete all required items before proceeding
            </p>
          </div>
        )}

        {/* Info about next steps */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent>
            <h3 className="font-medium text-blue-900 mb-2">
              What happens next?
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Inspection will be marked as "Field Complete"</li>
              <li>• Data will sync to the cloud when connected</li>
              <li>• Continue to Desktop Review to polish notes with AI</li>
              <li>• Generate professional PDF report</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/inspection/${id}`)}
            className="flex-1"
          >
            ← Back to Inspection
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!requiredComplete || isSubmitting || isSyncing}
            className="flex-1"
          >
            {isSubmitting || isSyncing ? (
              <>
                <span className="animate-spin mr-2">🔄</span>
                {isSyncing ? 'Syncing...' : 'Completing...'}
              </>
            ) : (
              'Mark Field Complete ✓'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FieldComplete;
