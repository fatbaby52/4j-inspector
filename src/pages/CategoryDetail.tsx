// pages/CategoryDetail.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { GradeSelector, GradeBadge } from '@/components/common/GradeSelector';
import { TextArea } from '@/components/common/TextArea';
import { useInspectionStore } from '@/stores/inspectionStore';
import { getCategoryById } from '@/data/inspectionCategories';
import { cn } from '@/lib/utils';
import type { Grade, InspectionItemDef } from '@/types/inspection';

export function CategoryDetail() {
  const { id, categoryId } = useParams<{ id: string; categoryId: string }>();
  const navigate = useNavigate();
  const {
    currentInspection,
    loadInspection,
    addObservation,
    updateObservation,
    addNote,
    isLoading
  } = useInspectionStore();

  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  const category = categoryId ? getCategoryById(categoryId) : undefined;

  useEffect(() => {
    if (id && !currentInspection) {
      loadInspection(id);
    }
  }, [id, currentInspection, loadInspection]);

  if (isLoading || !currentInspection || !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  const getItemObservation = (itemId: string) => {
    const observations = currentInspection.observations[itemId];
    return observations && observations.length > 0 ? observations[0] : null;
  };

  const handleGradeSelect = async (itemId: string, grade: Grade) => {
    const existing = getItemObservation(itemId);

    if (existing) {
      await updateObservation(itemId, existing.id, { grade });
    } else {
      await addObservation(itemId, grade);
    }
  };

  const handleSaveNote = async (itemId: string) => {
    if (!noteText.trim()) return;

    const observation = getItemObservation(itemId);
    if (observation) {
      await addNote(itemId, observation.id, noteText.trim(), 'typed');
      setNoteText('');
      setActiveItem(null);
    }
  };

  const handleMarkAllNA = async () => {
    for (const item of category.items) {
      const existing = getItemObservation(item.id);
      if (!existing) {
        await addObservation(item.id, 'na');
      }
    }
  };

  // Calculate progress
  const completedCount = category.items.filter(
    (item) => getItemObservation(item.id) !== null
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header
        title={category.name}
        showBack
        backTo={`/inspection/${id}`}
      />

      <div className="p-4 space-y-4">
        {/* Category Header */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{category.icon}</span>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">{category.name}</h2>
                <p className="text-sm text-gray-500">
                  {completedCount}/{category.items.length} items inspected
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${(completedCount / category.items.length) * 100}%`
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick N/A Button */}
        <Button
          variant="outline"
          fullWidth
          onClick={handleMarkAllNA}
          className="text-gray-600"
        >
          <span className="mr-2">⚡</span>
          Mark All Items as N/A
        </Button>

        {/* Items List */}
        <div className="space-y-3">
          {category.items.map((item) => {
            const observation = getItemObservation(item.id);
            const isActive = activeItem === item.id;

            return (
              <Card
                key={item.id}
                className={cn(
                  'transition-all',
                  observation && 'border-l-4',
                  observation?.grade === 'good' && 'border-l-green-500',
                  observation?.grade === 'fair' && 'border-l-yellow-500',
                  observation?.grade === 'poor' && 'border-l-red-500',
                  observation?.grade === 'na' && 'border-l-gray-400'
                )}
              >
                <CardContent>
                  {/* Item Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    {observation && (
                      <GradeBadge grade={observation.grade} />
                    )}
                  </div>

                  {/* Grade Selector */}
                  <GradeSelector
                    value={observation?.grade || null}
                    onChange={(grade) => handleGradeSelect(item.id, grade)}
                    size="sm"
                  />

                  {/* Show notes and actions if graded */}
                  {observation && (
                    <div className="mt-4 space-y-3">
                      {/* Existing Notes */}
                      {observation.notes.length > 0 && (
                        <div className="space-y-2">
                          {observation.notes.map((note) => (
                            <div
                              key={note.id}
                              className="p-2 bg-gray-50 rounded-lg text-sm text-gray-700"
                            >
                              {note.rawText}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Note Button / Note Input */}
                      {isActive ? (
                        <div className="space-y-2">
                          <TextArea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add observation notes..."
                            rows={3}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setActiveItem(null);
                                setNoteText('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveNote(item.id)}
                              disabled={!noteText.trim()}
                            >
                              Save Note
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveItem(item.id)}
                            className="flex-1"
                          >
                            <span className="mr-1">📝</span> Add Note
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/inspection/${id}/category/${categoryId}/item/${item.id}/photos`
                              )
                            }
                            className="flex-1"
                          >
                            <span className="mr-1">📷</span> Photos
                            {observation.photoIds.length > 0 && (
                              <span className="ml-1 text-xs bg-gray-200 px-1.5 rounded-full">
                                {observation.photoIds.length}
                              </span>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Limitations Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent>
            <h4 className="font-medium text-blue-900 mb-2">
              Inspection Limitations
            </h4>
            <p className="text-sm text-blue-800">{category.limitations}</p>
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
            Back to Checklist
          </Button>
          <Button
            onClick={() => {
              // Navigate to next category
              const categories = category ? [category] : [];
              const currentIndex = categories.findIndex(
                (c) => c.id === categoryId
              );
              // For now, just go back
              navigate(`/inspection/${id}`);
            }}
            className="flex-1"
          >
            Done with {category.name}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CategoryDetail;
