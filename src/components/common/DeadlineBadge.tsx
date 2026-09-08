import React from 'react';
import { Badge } from './Badge';

interface DeadlineBadgeProps {
  hoursLeft: number;
}

export const DeadlineBadge: React.FC<DeadlineBadgeProps> = ({ hoursLeft }) => {
  if (hoursLeft < 0) {
    const overdueHours = Math.abs(hoursLeft);
    return (
      <Badge variant="danger" size="sm" className="font-mono font-medium">
        Просрочено ({overdueHours}ч)
      </Badge>
    );
  }

  if (hoursLeft <= 24) {
    return (
      <Badge variant="danger" size="sm" className="font-mono font-medium">
        {hoursLeft}ч до срока
      </Badge>
    );
  }

  if (hoursLeft <= 48) {
    return (
      <Badge variant="warning" size="sm" className="font-mono font-medium">
        {hoursLeft}ч
      </Badge>
    );
  }

  const days = Math.round(hoursLeft / 24);
  return (
    <span className="text-xs text-zinc-400 font-mono">
      {days > 1 ? `${days} дн.` : `${hoursLeft} ч.`}
    </span>
  );
};
