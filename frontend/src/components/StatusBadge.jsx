import React from 'react';

const statusConfig = {
  Open: {
    bg: 'bg-sky-100 text-sky-800 border-sky-300',
    dot: 'bg-sky-500',
  },
  Assigned: {
    bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    dot: 'bg-indigo-500',
  },
  'In Progress': {
    bg: 'bg-purple-100 text-purple-800 border-purple-300',
    dot: 'bg-purple-500',
  },
  Resolved: {
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  Closed: {
    bg: 'bg-slate-100 text-slate-700 border-slate-300',
    dot: 'bg-slate-400',
  },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.Open;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
