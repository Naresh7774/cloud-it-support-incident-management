import React from 'react';

const StatCard = ({ title, count, icon: Icon, color = 'blue', alert = false, subtitle }) => {
  const colorMap = {
    blue: 'bg-brand-primary/10 text-brand-accent border-brand-primary/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    slate: 'bg-slate-700/20 text-slate-300 border-slate-600/30',
  };

  const badgeClass = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`bg-dark-card rounded-2xl p-5 shadow-lg border transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-xl ${
        alert
          ? 'border-rose-500/40 ring-1 ring-rose-500/30'
          : 'border-dark-border hover:border-brand-primary/40'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-dark-muted tracking-wider uppercase">{title}</span>
        <div className={`p-2.5 rounded-xl border ${badgeClass} group-hover:scale-110 transition-transform`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-black text-white tracking-tight">{count ?? 0}</span>
        {alert && (
          <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Attention
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
