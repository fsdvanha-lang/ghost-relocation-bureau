import React from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { Badge } from './Badge';

interface DeadlineBadgeProps {
  hoursLeft: number;
}

export const DeadlineBadge: React.FC<DeadlineBadgeProps> = ({ hoursLeft }) => {
  if (hoursLeft < 0) {
    const overdueHours = Math.abs(hoursLeft);
    return (
      <Badge variant="danger" className="animate-pulse flex items-center gap-1 font-semibold">
        <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
        <span>Просрочено ({overdueHours} ч.)</span>
      </Badge>
    );
  }

  if (hoursLeft <= 24) {
    return (
      <Badge variant="danger" className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
        <span>Срочно ({hoursLeft} ч.)</span>
      </Badge>
    );
  }

  if (hoursLeft <= 48) {
    return (
      <Badge variant="warning" className="flex items-center gap-1">
        <Clock className="w-3 h-3 text-amber-400 shrink-0" />
        <span>Внимание ({hoursLeft} ч.)</span>
      </Badge>
    );
  }

  const days = Math.round(hoursLeft / 24);
  return (
    <Badge variant="default" className="flex items-center gap-1 text-slate-400">
      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
      <span>{days > 1 ? `${days} дн.` : `${hoursLeft} ч.`}</span>
    </Badge>
  );
};
