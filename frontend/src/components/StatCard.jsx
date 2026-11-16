import React from 'react';

const StatCard = ({ title, count, icon: Icon, color = 'blue', alert = false, subtitle }) => {
  const colorMap = {
    blue: 'bg-sky-50 text-sky-600 border-sky-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-red-50 text-red-600 border-red-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  const badgeClass = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm border transition hover:shadow-md ${
        alert ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`p-2 rounded-lg border ${badgeClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">{count ?? 0}</span>
        {alert && (
          <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
            Action Needed
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
