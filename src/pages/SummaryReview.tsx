// pages/SummaryReview.tsx

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { EditableTextBlock } from '@/components/review/EditableTextBlock';
import { useInspectionStore } from '@/stores/inspectionStore';
import { generateExecutiveSummary } from '@/services/aiService';
import type { AIContent } from '@/types/inspection';

export function SummaryReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentInspection, loadInspection, updateInspection, isLoading } = useInspectionStore();

  const [isGenerating, setIsGenerating] = useState(false);

  // Load inspection if not already loaded
  useEffect(() => {
    if (id && !currentInspection) {
      loadInspection(id);
    }
  }, [id, currentInspection, loadInspection]);

  // Auto-generate if no summary exists
  useEffect(() => {
    if (currentInspection && !currentInspection.executiveSummary && !isGenerating) {
      handleGenerate();
    }
  }, [currentInspection?.id]);

  const handleGenerate = useCallback(async (feedback?: string) => {
    if (!currentInspection) return;

    setIsGenerating(true);
    try {
      const summary = await generateExecutiveSummary(currentInspection, feedback);

      const aiContent: AIContent = {
        text: summary,
        reviewStatus: 'pending',
        revisionHistory: currentInspection.executiveSummary?.revisionHistory || [],
        lastFeedback: feedback,
      };

      // Add previous version to history if it exists
      if (currentInspection.executiveSummary?.text) {
        aiContent.revisionHistory = [
          ...aiContent.revisionHistory,
          currentInspection.executiveSummary.text,
        ];
      }

      await updateInspection({ executiveSummary: aiContent });
    } catch (error) {
      console.error('Failed to generate summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [currentInspection, updateInspection]);

  const handleAccept = useCallback(async () => {
    if (!currentInspection?.executiveSummary) return;

    await updateInspection({
      executiveSummary: {
        ...currentInspection.executiveSummary,
        reviewStatus: 'accepted',
      },
    });
  }, [currentInspection, updateInspection]);

  const handleEdit = useCallback(async (newText: string) => {
    if (!currentInspection) return;

    const aiContent: AIContent = {
      text: newText,
      reviewStatus: 'edited',
      revisionHistory: currentInspection.executiveSummary?.revisionHistory || [],
    };

    await updateInspection({ executiveSummary: aiContent });
  }, [currentInspection, updateInspection]);

  if (isLoading || !currentInspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  const summary = currentInspection.executiveSummary;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header title="Executive Summary" showBack backTo={`/inspection/${id}/review`} />

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent>
            <h4 className="font-medium text-blue-900 mb-1">About Executive Summary</h4>
            <p className="text-sm text-blue-700">
              The executive summary provides a high-level overview of the inspection findings.
              It appears at the beginning of the report and helps clients quickly understand
              the overall condition of the property.
            </p>
          </CardContent>
        </Card>

        {/* Summary Editor */}
        <EditableTextBlock
          title="Executive Summary"
          currentText={summary?.text || ''}
          reviewStatus={summary?.reviewStatus || 'pending'}
          isGenerating={isGenerating}
          onAccept={handleAccept}
          onEdit={handleEdit}
          onRegenerate={handleGenerate}
          placeholder="The executive summary will be generated based on your inspection findings..."
        />

        {/* Revision History */}
        {summary?.revisionHistory && summary.revisionHistory.length > 0 && (
          <Card>
            <CardContent>
              <h4 className="font-medium text-gray-900 mb-3">Previous Versions</h4>
              <div className="space-y-3">
                {summary.revisionHistory.map((version, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Version {index + 1}</p>
                    <p className="text-sm text-gray-600 line-clamp-3">{version}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card>
          <CardContent>
            <h4 className="font-medium text-gray-900 mb-2">Tips for a Good Summary</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Keep it concise - 2-4 paragraphs is ideal</li>
              <li>• Highlight the most important findings</li>
              <li>• Mention any safety concerns first</li>
              <li>• Provide an overall assessment of property condition</li>
              <li>• Avoid technical jargon when possible</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/inspection/${id}/review/notes`)}
            className="flex-1"
          >
            Back to Notes
          </Button>
          <Button
            onClick={() => navigate(`/inspection/${id}/review/recommendations`)}
            className="flex-1"
            disabled={!summary || summary.reviewStatus === 'pending'}
          >
            Next: Recommendations
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SummaryReview;
