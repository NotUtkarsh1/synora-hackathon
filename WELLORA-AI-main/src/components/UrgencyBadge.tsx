import React from 'react';
import { UrgencyLevel } from '../types';
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  className?: string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency, className = '' }) => {
  if (urgency === 'EMERGENCY') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-sm border border-red-700 animate-pulse tracking-wide ${className}`}
        role="status"
        aria-label="Urgency level: Emergency"
      >
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
        <span>EMERGENCY</span>
      </span>
    );
  }

  if (urgency === 'HIGH') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-orange-500 text-white shadow-xs border border-orange-600 tracking-wide ${className}`}
        role="status"
        aria-label="Urgency level: High"
      >
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>HIGH</span>
      </span>
    );
  }

  if (urgency === 'MEDIUM') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-amber-950 shadow-xs border border-amber-500 tracking-wide ${className}`}
        role="status"
        aria-label="Urgency level: Medium"
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>MEDIUM</span>
      </span>
    );
  }

  // LOW
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-xs border border-emerald-700 tracking-wide ${className}`}
      role="status"
      aria-label="Urgency level: Low"
    >
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      <span>LOW</span>
    </span>
  );
};
