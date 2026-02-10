// components/review/AcceptDeclineButtons.tsx

import React from 'react';
import { Button } from '@/components/common/Button';

interface AcceptDeclineButtonsProps {
  onAccept: () => void;
  onDecline: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
  acceptLabel?: string;
  declineLabel?: string;
  disabled?: boolean;
  showEdit?: boolean;
  showRegenerate?: boolean;
}

export function AcceptDeclineButtons({
  onAccept,
  onDecline,
  onEdit,
  onRegenerate,
  acceptLabel = 'Accept',
  declineLabel = 'Decline',
  disabled = false,
  showEdit = true,
  showRegenerate = false,
}: AcceptDeclineButtonsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        size="sm"
        onClick={onAccept}
        disabled={disabled}
      >
        ✓ {acceptLabel}
      </Button>

      {showEdit && onEdit && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onEdit}
          disabled={disabled}
        >
          ✏️ Edit
        </Button>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={onDecline}
        disabled={disabled}
      >
        ✕ {declineLabel}
      </Button>

      {showRegenerate && onRegenerate && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRegenerate}
          disabled={disabled}
        >
          🔄 Regenerate
        </Button>
      )}
    </div>
  );
}

export default AcceptDeclineButtons;
