// components/review/NoteCleanupCard.tsx

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TextArea } from '@/components/common/TextArea';
import type { Note, ReviewStatus } from '@/types/inspection';
import { cn } from '@/lib/utils';

interface NoteCleanupCardProps {
  note: Note;
  itemName: string;
  categoryName: string;
  grade: string;
  isProcessing?: boolean;
  onAccept: (noteId: string) => void;
  onDecline: (noteId: string) => void;
  onEdit: (noteId: string, newText: string) => void;
  onEditRaw?: (noteId: string, newRawText: string) => void;
  onRegenerate?: (noteId: string) => void;
}

export function NoteCleanupCard({
  note,
  itemName,
  categoryName,
  grade,
  isProcessing = false,
  onAccept,
  onDecline,
  onEdit,
  onEditRaw,
  onRegenerate,
}: NoteCleanupCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [editedText, setEditedText] = useState(note.cleanedText || note.rawText);
  const [editedRawText, setEditedRawText] = useState(note.rawText);

  const handleSaveEdit = () => {
    onEdit(note.id, editedText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(note.cleanedText || note.rawText);
    setIsEditing(false);
  };

  const handleSaveRawEdit = () => {
    if (onEditRaw) {
      onEditRaw(note.id, editedRawText);
    }
    setIsEditingRaw(false);
  };

  const handleCancelRawEdit = () => {
    setEditedRawText(note.rawText);
    setIsEditingRaw(false);
  };

  const statusColors: Record<ReviewStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    accepted: 'bg-green-100 text-green-800 border-green-200',
    declined: 'bg-red-100 text-red-800 border-red-200',
    edited: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const statusLabels: Record<ReviewStatus, string> = {
    pending: 'Pending Review',
    accepted: 'Accepted',
    declined: 'Declined',
    edited: 'Edited',
  };

  return (
    <Card className={cn(
      'transition-all',
      note.reviewStatus === 'accepted' && 'border-green-300',
      note.reviewStatus === 'declined' && 'border-red-300 opacity-60',
      note.reviewStatus === 'edited' && 'border-blue-300'
    )}>
      <CardContent>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">{categoryName}</p>
            <h4 className="font-medium text-gray-900">{itemName}</h4>
            <span className={cn(
              'inline-block mt-1 px-2 py-0.5 text-xs rounded-full capitalize',
              grade === 'good' && 'bg-green-100 text-green-800',
              grade === 'fair' && 'bg-yellow-100 text-yellow-800',
              grade === 'poor' && 'bg-red-100 text-red-800',
              grade === 'na' && 'bg-gray-100 text-gray-800'
            )}>
              {grade}
            </span>
          </div>
          <span className={cn(
            'px-2 py-1 text-xs rounded-full border',
            statusColors[note.reviewStatus]
          )}>
            {statusLabels[note.reviewStatus]}
          </span>
        </div>

        {/* Original Note */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500">Original Note:</p>
            {onEditRaw && !isEditingRaw && (
              <button
                onClick={() => setIsEditingRaw(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                ✏️ Edit Original
              </button>
            )}
          </div>
          {isEditingRaw ? (
            <div>
              <TextArea
                value={editedRawText}
                onChange={(e) => setEditedRawText(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleSaveRawEdit}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={handleCancelRawEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {note.rawText}
              {note.inputMethod === 'voice' && (
                <span className="ml-2 text-xs text-gray-400">🎤 voice</span>
              )}
            </p>
          )}
        </div>

        {/* Cleaned/Edited Note */}
        {isEditing ? (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Edit Note:</p>
            <TextArea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleSaveEdit}>
                Save Changes
              </Button>
              <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : note.cleanedText ? (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">
              {note.reviewStatus === 'edited' ? 'Your Edit:' : 'AI Suggestion:'}
            </p>
            <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded border border-blue-100">
              {note.cleanedText}
            </p>
          </div>
        ) : isProcessing ? (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">AI Suggestion:</p>
            <div className="bg-gray-50 p-3 rounded animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : null}

        {/* Actions */}
        {note.reviewStatus === 'pending' && note.cleanedText && !isEditing && (
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => onAccept(note.id)}>
              ✓ Accept
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
              ✏️ Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDecline(note.id)}>
              ✕ Use Original
            </Button>
            {onRegenerate && (
              <Button size="sm" variant="outline" onClick={() => onRegenerate(note.id)}>
                🔄 Regenerate
              </Button>
            )}
          </div>
        )}

        {/* Already reviewed actions */}
        {note.reviewStatus !== 'pending' && !isEditing && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              ✏️ Edit
            </Button>
            {note.reviewStatus === 'declined' && note.cleanedText && (
              <Button size="sm" variant="outline" onClick={() => onAccept(note.id)}>
                Use AI Version
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NoteCleanupCard;
