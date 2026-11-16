import React from 'react';
import { AlertCircle, AlertTriangle, Clock, ArrowDown } from 'lucide-react';

const priorityConfig = {
  Critical: {
    bg: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertCircle,
    label: 'Critical',
  },
  High: {
    bg: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: AlertTriangle,
    label: 'High',
  },
  Medium: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
    label: 'Medium',
  },
  Low: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: ArrowDown,
    label: 'Low',
  },
};

const PriorityBadge = ({ priority }) => {
  const config = priorityConfig[priority] || priorityConfig.Medium;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

export default PriorityBadge;
