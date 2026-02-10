// components/review/RecommendationCard.tsx

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { TextArea } from '@/components/common/TextArea';
import { SelectField } from '@/components/common/SelectField';
import type { Recommendation, ReviewStatus } from '@/types/inspection';
import { cn } from '@/lib/utils';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept: (id: string) => void;
  onEdit: (id: string, updates: Partial<Recommendation>) => void;
  onRemove: (id: string) => void;
}

const priorityOptions = [
  { value: 'high', label: 'High Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'low', label: 'Low Priority' },
];

const urgencyOptions = [
  { value: 'Immediate', label: 'Immediate' },
  { value: 'Within 30 days', label: 'Within 30 days' },
  { value: 'Within 6 months', label: 'Within 6 months' },
  { value: 'Within 12 months', label: 'Within 12 months' },
  { value: 'When convenient', label: 'When convenient' },
];

export function RecommendationCard({
  recommendation,
  onAccept,
  onEdit,
  onRemove,
}: RecommendationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: recommendation.title,
    description: recommendation.description,
    priority: recommendation.priority,
    estimatedUrgency: recommendation.estimatedUrgency,
  });

  const handleSaveEdit = () => {
    onEdit(recommendation.id, editForm);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      title: recommendation.title,
      description: recommendation.description,
      priority: recommendation.priority,
      estimatedUrgency: recommendation.estimatedUrgency,
    });
    setIsEditing(false);
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };

  const priorityBorders = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500',
  };

  const statusColors: Record<ReviewStatus, string> = {
    pending: '',
    accepted: 'bg-green-50',
    declined: 'bg-red-50 opacity-60',
    edited: 'bg-blue-50',
  };

  if (recommendation.reviewStatus === 'declined') {
    return null; // Don't show removed recommendations
  }

  return (
    <Card className={cn(
      'border-l-4 transition-all',
      priorityBorders[recommendation.priority],
      statusColors[recommendation.reviewStatus]
    )}>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <TextField
              label="Title"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />

            <TextArea
              label="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
            />

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Priority"
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as 'high' | 'medium' | 'low' })}
                options={priorityOptions}
              />

              <SelectField
                label="Urgency"
                value={editForm.estimatedUrgency}
                onChange={(e) => setEditForm({ ...editForm, estimatedUrgency: e.target.value })}
                options={urgencyOptions}
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                Save Changes
              </Button>
              <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded-full border',
                    priorityColors[recommendation.priority]
                  )}>
                    {recommendation.priority.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {recommendation.category}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
              </div>

              {recommendation.reviewStatus !== 'pending' && (
                <span className={cn(
                  'px-2 py-0.5 text-xs rounded-full',
                  recommendation.reviewStatus === 'accepted' && 'bg-green-100 text-green-800',
                  recommendation.reviewStatus === 'edited' && 'bg-blue-100 text-blue-800'
                )}>
                  {recommendation.reviewStatus === 'accepted' ? '✓' : '✏️'}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-3">
              {recommendation.description}
            </p>

            {/* Urgency */}
            <p className="text-xs text-gray-500 mb-3">
              <span className="font-medium">Recommended Timeline:</span>{' '}
              {recommendation.estimatedUrgency}
            </p>

            {/* Actions */}
            {recommendation.reviewStatus === 'pending' ? (
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => onAccept(recommendation.id)}>
                  ✓ Keep
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
                  ✏️ Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => onRemove(recommendation.id)}>
                  ✕ Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  ✏️ Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => onRemove(recommendation.id)}>
                  ✕ Remove
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default RecommendationCard;
