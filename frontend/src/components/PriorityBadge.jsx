import React from 'react';
import { AlertCircle, AlertTriangle, Clock, ArrowDown } from 'lucide-react';

const priorityConfig = {
  Critical: {
    bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-500',
    icon: AlertCircle,
    label: 'Critical',
  },
  High: {
    bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    dot: 'bg-orange-500',
    icon: AlertTriangle,
    label: 'High',
  },
  Medium: {
    bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
    icon: Clock,
    label: 'Medium',
  },
  Low: {
    bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-500',
    icon: ArrowDown,
    label: 'Low',
  },
};

const PriorityBadge = ({ priority }) => {
  const config = priorityConfig[priority] || priorityConfig.Medium;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

export default PriorityBadge;
