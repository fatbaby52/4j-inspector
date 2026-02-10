// pages/FinalReview.tsx

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { SignatureCapture } from '@/components/common/SignatureCapture';
import { useInspectionStore } from '@/stores/inspectionStore';

export function FinalReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentInspection, loadInspection, updateInspection, markReviewComplete, isLoading, isSaving } =
    useInspectionStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load inspection if not already loaded
  useEffect(() => {
    if (id && !currentInspection) {
      loadInspection(id);
    }
  }, [id, currentInspection, loadInspection]);

  const handleSignatureChange = useCallback(async (dataUrl: string | undefined) => {
    await updateInspection({ inspectorSignature: dataUrl });
  }, [updateInspection]);

  const handleComplete = useCallback(async () => {
    if (!currentInspection?.inspectorSignature) {
      alert('Please add your signature before completing the review.');
      return;
    }

    setIsSubmitting(true);
    try {
      await markReviewComplete();
      navigate(`/inspection/${id}/report`);
    } catch (error) {
      console.error('Failed to complete review:', error);
      alert('Failed to complete review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentInspection, markReviewComplete, navigate, id]);

  if (isLoading || !currentInspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  // Calculate stats
  let totalObservations = 0;
  let goodCount = 0;
  let fairCount = 0;
  let poorCount = 0;

  Object.values(currentInspection.observations).forEach((obs) => {
    obs.forEach((o) => {
      totalObservations++;
      if (o.grade === 'good') goodCount++;
      else if (o.grade === 'fair') fairCount++;
      else if (o.grade === 'poor') poorCount++;
    });
  });

  const recommendationCount = currentInspection.recommendations.filter(
    (r) => r.reviewStatus !== 'declined'
  ).length;

  // Check readiness
  const hasSummary = currentInspection.executiveSummary?.reviewStatus !== 'pending';
  const hasSignature = !!currentInspection.inspectorSignature;
  const isReady = hasSummary && hasSignature;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header title="Final Review" showBack backTo={`/inspection/${id}/review`} />

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Report Preview Summary */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Summary</h3>

            {/* Property */}
            <div className="mb-4 pb-4 border-b">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Property</h4>
              <p className="font-medium text-gray-900">
                {currentInspection.propertyAddress.street}
              </p>
              <p className="text-sm text-gray-600">
                {currentInspection.propertyAddress.city}, {currentInspection.propertyAddress.state}{' '}
                {currentInspection.propertyAddress.zip}
              </p>
            </div>

            {/* Client */}
            <div className="mb-4 pb-4 border-b">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Client</h4>
              <p className="font-medium text-gray-900">{currentInspection.clientInfo.name}</p>
              <p className="text-sm text-gray-600">{currentInspection.clientInfo.email}</p>
            </div>

            {/* Inspection Stats */}
            <div className="mb-4 pb-4 border-b">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Inspection Results</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-900">{totalObservations}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-600">{goodCount}</div>
                  <div className="text-xs text-green-600">Good</div>
                </div>
                <div className="p-2 bg-yellow-50 rounded">
                  <div className="text-lg font-bold text-yellow-600">{fairCount}</div>
                  <div className="text-xs text-yellow-600">Fair</div>
                </div>
                <div className="p-2 bg-red-50 rounded">
                  <div className="text-lg font-bold text-red-600">{poorCount}</div>
                  <div className="text-xs text-red-600">Poor</div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Recommendations</h4>
              <p className="text-gray-900">
                {recommendationCount} recommendation{recommendationCount !== 1 ? 's' : ''} included
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardContent>
            <h3 className="font-medium text-gray-900 mb-3">Pre-Generation Checklist</h3>
            <div className="space-y-2">
              <ChecklistItem
                label="Notes reviewed"
                isComplete={true}
                onClick={() => navigate(`/inspection/${id}/review/notes`)}
              />
              <ChecklistItem
                label="Executive summary approved"
                isComplete={hasSummary}
                onClick={() => navigate(`/inspection/${id}/review/summary`)}
              />
              <ChecklistItem
                label="Recommendations reviewed"
                isComplete={true}
                onClick={() => navigate(`/inspection/${id}/review/recommendations`)}
              />
              <ChecklistItem
                label="Inspector signature added"
                isComplete={hasSignature}
              />
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        <Card>
          <CardContent>
            <SignatureCapture
              label="Inspector Signature"
              value={currentInspection.inspectorSignature}
              onChange={handleSignatureChange}
            />
            <p className="text-xs text-gray-500 mt-2">
              By signing, I certify that this inspection was performed according to professional
              standards and the information in this report is accurate to the best of my knowledge.
            </p>
          </CardContent>
        </Card>

        {/* Inspector info */}
        <Card>
          <CardContent>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Inspector</h4>
                <p className="font-medium text-gray-900">{currentInspection.inspectorName}</p>
              </div>
              <div className="text-right">
                <h4 className="text-sm font-medium text-gray-500">Date</h4>
                <p className="font-medium text-gray-900">
                  {new Date(currentInspection.inspectionDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning if not ready */}
        {!isReady && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent>
              <div className="flex items-center gap-2 text-yellow-800">
                <span>⚠️</span>
                <p className="text-sm">
                  Please complete all checklist items before generating the report.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/inspection/${id}/review/recommendations`)}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!isReady || isSubmitting || isSaving}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">🔄</span>
                Processing...
              </>
            ) : (
              'Complete & Generate Report'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Checklist item component
function ChecklistItem({
  label,
  isComplete,
  onClick,
}: {
  label: string;
  isComplete: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`
        flex items-center gap-3 p-2 rounded
        ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}
      `}
      onClick={onClick}
    >
      <span className={`text-lg ${isComplete ? 'text-green-500' : 'text-gray-300'}`}>
        {isComplete ? '✓' : '○'}
      </span>
      <span className={isComplete ? 'text-gray-900' : 'text-gray-500'}>{label}</span>
      {onClick && <span className="ml-auto text-gray-400 text-sm">Edit →</span>}
    </div>
  );
}

export default FinalReview;
