// pages/RecommendationsReview.tsx

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { TextField } from '@/components/common/TextField';
import { TextArea } from '@/components/common/TextArea';
import { SelectField } from '@/components/common/SelectField';
import { RecommendationCard } from '@/components/review/RecommendationCard';
import { useInspectionStore } from '@/stores/inspectionStore';
import { generateRecommendations } from '@/services/aiService';
import type { Recommendation } from '@/types/inspection';

export function RecommendationsReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentInspection, loadInspection, updateInspection, isLoading } = useInspectionStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRec, setNewRec] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    category: '',
    estimatedUrgency: 'Within 6 months',
  });

  // Load inspection if not already loaded
  useEffect(() => {
    if (id && !currentInspection) {
      loadInspection(id);
    }
  }, [id, currentInspection, loadInspection]);

  // Auto-generate if no recommendations exist
  useEffect(() => {
    if (currentInspection && currentInspection.recommendations.length === 0 && !isGenerating) {
      handleGenerate();
    }
  }, [currentInspection?.id]);

  const handleGenerate = useCallback(async () => {
    if (!currentInspection) return;

    setIsGenerating(true);
    try {
      const recommendations = await generateRecommendations(currentInspection);
      await updateInspection({ recommendations });
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      alert('Failed to generate recommendations. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [currentInspection, updateInspection]);

  const handleAccept = useCallback(async (recId: string) => {
    if (!currentInspection) return;

    const updated = currentInspection.recommendations.map((rec) =>
      rec.id === recId ? { ...rec, reviewStatus: 'accepted' as const } : rec
    );
    await updateInspection({ recommendations: updated });
  }, [currentInspection, updateInspection]);

  const handleEdit = useCallback(async (recId: string, updates: Partial<Recommendation>) => {
    if (!currentInspection) return;

    const updated = currentInspection.recommendations.map((rec) =>
      rec.id === recId ? { ...rec, ...updates, reviewStatus: 'edited' as const } : rec
    );
    await updateInspection({ recommendations: updated });
  }, [currentInspection, updateInspection]);

  const handleRemove = useCallback(async (recId: string) => {
    if (!currentInspection) return;

    const updated = currentInspection.recommendations.map((rec) =>
      rec.id === recId ? { ...rec, reviewStatus: 'declined' as const } : rec
    );
    await updateInspection({ recommendations: updated });
  }, [currentInspection, updateInspection]);

  const handleAcceptAll = useCallback(async () => {
    if (!currentInspection) return;

    const updated = currentInspection.recommendations.map((rec) =>
      rec.reviewStatus === 'pending' ? { ...rec, reviewStatus: 'accepted' as const } : rec
    );
    await updateInspection({ recommendations: updated });
  }, [currentInspection, updateInspection]);

  const handleAddCustom = useCallback(async () => {
    if (!currentInspection || !newRec.title || !newRec.description) return;

    const recommendation: Recommendation = {
      id: crypto.randomUUID(),
      ...newRec,
      reviewStatus: 'edited',
    };

    await updateInspection({
      recommendations: [...currentInspection.recommendations, recommendation],
    });

    setNewRec({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      estimatedUrgency: 'Within 6 months',
    });
    setShowAddForm(false);
  }, [currentInspection, newRec, updateInspection]);

  if (isLoading || !currentInspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  const recommendations = currentInspection.recommendations.filter(
    (r) => r.reviewStatus !== 'declined'
  );
  const pendingRecs = recommendations.filter((r) => r.reviewStatus === 'pending');
  const highPriority = recommendations.filter((r) => r.priority === 'high');
  const mediumPriority = recommendations.filter((r) => r.priority === 'medium');
  const lowPriority = recommendations.filter((r) => r.priority === 'low');

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header title="Recommendations" showBack backTo={`/inspection/${id}/review`} />

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Stats */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Recommendation Summary</h3>
              {pendingRecs.length > 0 && (
                <Button size="sm" onClick={handleAcceptAll}>
                  ✓ Accept All ({pendingRecs.length})
                </Button>
              )}
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span>High: {highPriority.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span>Medium: {mediumPriority.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span>Low: {lowPriority.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isGenerating && (
          <Card className="animate-pulse">
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isGenerating && recommendations.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <span className="text-4xl block mb-4">✨</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Issues Found
              </h3>
              <p className="text-gray-500 mb-4">
                Great news! The property appears to be in good condition with no
                immediate recommendations.
              </p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" onClick={() => handleGenerate()}>
                  🔄 Regenerate
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
                  + Add Custom
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations list */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onAccept={handleAccept}
                onEdit={handleEdit}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}

        {/* Add custom button */}
        {!showAddForm && recommendations.length > 0 && (
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowAddForm(true)}
          >
            + Add Custom Recommendation
          </Button>
        )}

        {/* Add custom form */}
        {showAddForm && (
          <Card className="border-2 border-primary">
            <CardContent>
              <h4 className="font-medium text-gray-900 mb-4">Add Custom Recommendation</h4>
              <div className="space-y-4">
                <TextField
                  label="Title"
                  value={newRec.title}
                  onChange={(e) => setNewRec({ ...newRec, title: e.target.value })}
                  placeholder="Brief title for the recommendation"
                />

                <TextArea
                  label="Description"
                  value={newRec.description}
                  onChange={(e) => setNewRec({ ...newRec, description: e.target.value })}
                  placeholder="Detailed description and recommended action..."
                  rows={3}
                />

                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Priority"
                    value={newRec.priority}
                    onChange={(e) => setNewRec({ ...newRec, priority: e.target.value as 'high' | 'medium' | 'low' })}
                    options={[
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' },
                    ]}
                  />

                  <TextField
                    label="Category"
                    value={newRec.category}
                    onChange={(e) => setNewRec({ ...newRec, category: e.target.value })}
                    placeholder="e.g., Roofing"
                  />
                </div>

                <SelectField
                  label="Urgency"
                  value={newRec.estimatedUrgency}
                  onChange={(e) => setNewRec({ ...newRec, estimatedUrgency: e.target.value })}
                  options={[
                    { value: 'Immediate', label: 'Immediate' },
                    { value: 'Within 30 days', label: 'Within 30 days' },
                    { value: 'Within 6 months', label: 'Within 6 months' },
                    { value: 'Within 12 months', label: 'Within 12 months' },
                    { value: 'When convenient', label: 'When convenient' },
                  ]}
                />

                <div className="flex gap-2">
                  <Button onClick={handleAddCustom} disabled={!newRec.title || !newRec.description}>
                    Add Recommendation
                  </Button>
                  <Button variant="secondary" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Regenerate option */}
        {recommendations.length > 0 && (
          <div className="text-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerate()}
              disabled={isGenerating}
            >
              🔄 Regenerate All Recommendations
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/inspection/${id}/review/summary`)}
            className="flex-1"
          >
            Back to Summary
          </Button>
          <Button
            onClick={() => navigate(`/inspection/${id}/review/final`)}
            className="flex-1"
          >
            Next: Final Review
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RecommendationsReview;
