// pages/NoteReview.tsx

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/layout/Header';
import { NoteCleanupCard } from '@/components/review/NoteCleanupCard';
import { BatchCleanupProgress } from '@/components/review/BatchCleanupProgress';
import { useInspectionStore } from '@/stores/inspectionStore';
import { getCategoryById, getItemById } from '@/data/inspectionCategories';
import { cleanupNote } from '@/services/aiService';
import type { Note } from '@/types/inspection';

interface NoteWithContext {
  note: Note;
  itemId: string;
  observationId: string;
  categoryName: string;
  itemName: string;
  grade: string;
}

export function NoteReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentInspection, loadInspection, updateNote, isLoading } = useInspectionStore();

  const [processingNotes, setProcessingNotes] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    isRunning: boolean;
    isComplete: boolean;
    successCount: number;
    failedCount: number;
  } | null>(null);

  // Load inspection if not already loaded
  useEffect(() => {
    if (id && !currentInspection) {
      loadInspection(id);
    }
  }, [id, currentInspection, loadInspection]);

  // Gather all notes with context
  const notesWithContext = useMemo(() => {
    if (!currentInspection) return [];

    const notes: NoteWithContext[] = [];

    Object.entries(currentInspection.observations).forEach(([itemId, observations]) => {
      const item = getItemById(itemId);
      const category = item ? getCategoryById(item.categoryId) : null;

      observations.forEach((obs) => {
        obs.notes.forEach((note) => {
          notes.push({
            note,
            itemId,
            observationId: obs.id,
            categoryName: category?.name || 'Unknown',
            itemName: item?.name || itemId,
            grade: obs.grade,
          });
        });
      });
    });

    return notes;
  }, [currentInspection]);

  const pendingNotes = notesWithContext.filter((n) => n.note.reviewStatus === 'pending');
  const reviewedNotes = notesWithContext.filter((n) => n.note.reviewStatus !== 'pending');

  // Handle single note cleanup
  const handleCleanupNote = useCallback(async (noteCtx: NoteWithContext) => {
    setProcessingNotes((prev) => new Set(prev).add(noteCtx.note.id));

    try {
      const cleanedText = await cleanupNote(noteCtx.note, {
        category: noteCtx.categoryName,
        item: noteCtx.itemName,
        grade: noteCtx.grade,
      });

      await updateNote(noteCtx.itemId, noteCtx.observationId, noteCtx.note.id, {
        cleanedText,
      });
    } catch (error) {
      console.error('Failed to cleanup note:', error);
    } finally {
      setProcessingNotes((prev) => {
        const next = new Set(prev);
        next.delete(noteCtx.note.id);
        return next;
      });
    }
  }, [updateNote]);

  // Handle batch cleanup
  const handleBatchCleanup = useCallback(async () => {
    const notesToProcess = pendingNotes.filter((n) => !n.note.cleanedText);

    if (notesToProcess.length === 0) {
      alert('All notes already have AI suggestions.');
      return;
    }

    setBatchProgress({
      current: 0,
      total: notesToProcess.length,
      isRunning: true,
      isComplete: false,
      successCount: 0,
      failedCount: 0,
    });

    // Process notes one by one
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < notesToProcess.length; i++) {
      const noteCtx = notesToProcess[i];

      try {
        const cleanedText = await cleanupNote(noteCtx.note, {
          category: noteCtx.categoryName,
          item: noteCtx.itemName,
          grade: noteCtx.grade,
        });
        await updateNote(noteCtx.itemId, noteCtx.observationId, noteCtx.note.id, {
          cleanedText,
        });
        successCount++;
      } catch (error) {
        console.error('Failed to cleanup note:', error);
        failedCount++;
      }

      setBatchProgress((prev) => prev ? {
        ...prev,
        current: i + 1,
        successCount,
        failedCount,
      } : null);
    }

    setBatchProgress((prev) => prev ? {
      ...prev,
      isRunning: false,
      isComplete: true,
    } : null);
  }, [pendingNotes, updateNote]);

  // Handle accept
  const handleAccept = useCallback(async (noteCtx: NoteWithContext) => {
    await updateNote(noteCtx.itemId, noteCtx.observationId, noteCtx.note.id, {
      reviewStatus: 'accepted',
    });
  }, [updateNote]);

  // Handle decline (use original)
  const handleDecline = useCallback(async (noteCtx: NoteWithContext) => {
    await updateNote(noteCtx.itemId, noteCtx.observationId, noteCtx.note.id, {
      reviewStatus: 'declined',
      cleanedText: noteCtx.note.rawText, // Use original
    });
  }, [updateNote]);

  // Handle edit
  const handleEdit = useCallback(async (noteCtx: NoteWithContext, newText: string) => {
    await updateNote(noteCtx.itemId, noteCtx.observationId, noteCtx.note.id, {
      cleanedText: newText,
      reviewStatus: 'edited',
    });
  }, [updateNote]);

  // Accept all pending
  const handleAcceptAll = useCallback(async () => {
    const notesWithSuggestions = pendingNotes.filter((n) => n.note.cleanedText);

    for (const noteCtx of notesWithSuggestions) {
      await updateNote(noteCtx.itemId, noteCtx.observationId, noteCtx.note.id, {
        reviewStatus: 'accepted',
      });
    }
  }, [pendingNotes, updateNote]);

  if (isLoading || !currentInspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }

  if (notesWithContext.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <Header title="Review Notes" showBack backTo={`/inspection/${id}/review`} />
        <div className="p-4 max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <span className="text-4xl block mb-4">📝</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Notes to Review</h3>
              <p className="text-gray-500 mb-4">
                This inspection doesn't have any field notes.
              </p>
              <Button onClick={() => navigate(`/inspection/${id}/review`)}>
                Continue to Summary
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const pendingWithoutSuggestions = pendingNotes.filter((n) => !n.note.cleanedText);
  const pendingWithSuggestions = pendingNotes.filter((n) => n.note.cleanedText);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header title="Review Notes" showBack backTo={`/inspection/${id}/review`} />

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Stats */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Note Review Progress</h3>
                <p className="text-sm text-gray-500">
                  {reviewedNotes.length}/{notesWithContext.length} notes reviewed
                </p>
              </div>
              <div className="text-2xl font-bold text-primary">
                {Math.round((reviewedNotes.length / notesWithContext.length) * 100)}%
              </div>
            </div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(reviewedNotes.length / notesWithContext.length) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Batch actions */}
        {pendingNotes.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent>
              <h4 className="font-medium text-blue-900 mb-2">Batch Actions</h4>
              <div className="flex gap-2 flex-wrap">
                {pendingWithoutSuggestions.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleBatchCleanup}
                    disabled={batchProgress?.isRunning}
                  >
                    🤖 Generate All AI Suggestions ({pendingWithoutSuggestions.length})
                  </Button>
                )}
                {pendingWithSuggestions.length > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleAcceptAll}
                  >
                    ✓ Accept All Suggestions ({pendingWithSuggestions.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Notes */}
        {pendingNotes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Pending Review ({pendingNotes.length})
            </h3>

            {pendingNotes.map((noteCtx) => (
              <div key={noteCtx.note.id}>
                {/* Generate button if no suggestion yet */}
                {!noteCtx.note.cleanedText && !processingNotes.has(noteCtx.note.id) && (
                  <div className="mb-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCleanupNote(noteCtx)}
                    >
                      🤖 Generate AI Suggestion
                    </Button>
                  </div>
                )}

                <NoteCleanupCard
                  note={noteCtx.note}
                  itemName={noteCtx.itemName}
                  categoryName={noteCtx.categoryName}
                  grade={noteCtx.grade}
                  isProcessing={processingNotes.has(noteCtx.note.id)}
                  onAccept={() => handleAccept(noteCtx)}
                  onDecline={() => handleDecline(noteCtx)}
                  onEdit={(_, newText) => handleEdit(noteCtx, newText)}
                  onRegenerate={() => handleCleanupNote(noteCtx)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Reviewed Notes */}
        {reviewedNotes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Reviewed ({reviewedNotes.length})
            </h3>

            {reviewedNotes.map((noteCtx) => (
              <NoteCleanupCard
                key={noteCtx.note.id}
                note={noteCtx.note}
                itemName={noteCtx.itemName}
                categoryName={noteCtx.categoryName}
                grade={noteCtx.grade}
                onAccept={() => handleAccept(noteCtx)}
                onDecline={() => handleDecline(noteCtx)}
                onEdit={(_, newText) => handleEdit(noteCtx, newText)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Batch progress overlay */}
      {batchProgress && (
        <BatchCleanupProgress
          current={batchProgress.current}
          total={batchProgress.total}
          isComplete={batchProgress.isComplete}
          successCount={batchProgress.successCount}
          failedCount={batchProgress.failedCount}
          onClose={() => setBatchProgress(null)}
        />
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/inspection/${id}/review`)}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={() => navigate(`/inspection/${id}/review/summary`)}
            className="flex-1"
          >
            Next: Executive Summary
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NoteReview;
