// components/review/EditableTextBlock.tsx

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TextArea } from '@/components/common/TextArea';
import type { ReviewStatus } from '@/types/inspection';
import { cn } from '@/lib/utils';

interface EditableTextBlockProps {
  title: string;
  originalText?: string;
  currentText: string;
  reviewStatus: ReviewStatus;
  isGenerating?: boolean;
  onAccept: () => void;
  onEdit: (newText: string) => void;
  onRegenerate?: (feedback?: string) => void;
  placeholder?: string;
}

export function EditableTextBlock({
  title,
  originalText,
  currentText,
  reviewStatus,
  isGenerating = false,
  onAccept,
  onEdit,
  onRegenerate,
  placeholder = 'Enter text...',
}: EditableTextBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(currentText);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSaveEdit = () => {
    onEdit(editedText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(currentText);
    setIsEditing(false);
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(feedback || undefined);
      setShowFeedback(false);
      setFeedback('');
    }
  };

  const statusColors: Record<ReviewStatus, string> = {
    pending: 'border-yellow-200',
    accepted: 'border-green-300',
    declined: 'border-red-300',
    edited: 'border-blue-300',
  };

  return (
    <Card className={cn('transition-all', statusColors[reviewStatus])}>
      <CardContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {reviewStatus !== 'pending' && (
            <span className={cn(
              'px-2 py-1 text-xs rounded-full',
              reviewStatus === 'accepted' && 'bg-green-100 text-green-800',
              reviewStatus === 'edited' && 'bg-blue-100 text-blue-800',
              reviewStatus === 'declined' && 'bg-red-100 text-red-800'
            )}>
              {reviewStatus === 'accepted' ? '✓ Accepted' :
               reviewStatus === 'edited' ? '✏️ Edited' : '✕ Declined'}
            </span>
          )}
        </div>

        {/* Content */}
        {isGenerating ? (
          <div className="bg-gray-50 p-4 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ) : isEditing ? (
          <div className="space-y-3">
            <TextArea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={6}
              placeholder={placeholder}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                Save Changes
              </Button>
              <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : currentText ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{currentText}</p>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
            <p>No content generated yet.</p>
            {onRegenerate && (
              <Button
                size="sm"
                className="mt-2"
                onClick={() => onRegenerate()}
              >
                Generate Now
              </Button>
            )}
          </div>
        )}

        {/* Feedback input for regeneration */}
        {showFeedback && onRegenerate && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <label className="block text-sm font-medium text-blue-900 mb-2">
              What would you like to change?
            </label>
            <TextArea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              placeholder="e.g., Make it more concise, focus on safety issues..."
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleRegenerate}>
                Regenerate
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setShowFeedback(false);
                  setFeedback('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        {currentText && !isEditing && !isGenerating && reviewStatus === 'pending' && (
          <div className="flex gap-2 mt-4 flex-wrap">
            <Button size="sm" onClick={onAccept}>
              ✓ Accept
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
              ✏️ Edit
            </Button>
            {onRegenerate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFeedback(true)}
              >
                🔄 Request Revision
              </Button>
            )}
          </div>
        )}

        {/* Already reviewed - allow re-edit */}
        {currentText && !isEditing && !isGenerating && reviewStatus !== 'pending' && (
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              ✏️ Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EditableTextBlock;
