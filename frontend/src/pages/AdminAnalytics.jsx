import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { analyticsApi } from '../api/analyticsApi';
import { useToast } from '../context/ToastContext';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Award,
  Layers,
  Calendar,
  RefreshCw,
  Download,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';

const AdminAnalytics = () => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await analyticsApi.getAnalytics();
      if (res.success && res.data) {
        setData(res.data);
        if (isManual) toast.success('Analytics intelligence synced with live MySQL data.');
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const overview = data?.overview || {};
  const leaderboard = data?.engineerLeaderboard || [];
  const categories = data?.categoryPerformance || [];
  const trends = data?.dailyTrends || [];

  const handleExportCSV = () => {
    if (!data) return;

    const csvContent = [
      'Cloud IncidentOps - Engineer Resolution Performance & Telemetry',
      `Exported At: ${new Date().toISOString()}`,
      '',
      'Engineer,Email,Total Assigned,Total Resolved,Avg Resolution Time',
      ...leaderboard.map(
        (e) => `"${e.name}","${e.email}",${e.total_assigned || 0},${e.total_resolved || 0},"${e.avg_formatted || '0m'}"`
      ),
      '',
      'Category,Incident Count,Avg Resolution Mins',
      ...categories.map(
        (c) => `"${c.category}",${c.count || 0},"${c.avg_resolution_mins || 0}m"`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Analytics CSV report downloaded.');
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-accent border border-brand-primary/20">
                Performance Telemetry
              </span>
              <span className="text-xs text-dark-muted font-mono">• MySQL Analytical Aggregation</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-brand-accent" />
              Support Analytics & Resolution Intelligence
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Real-time Mean Time To Resolution (MTTR), SLA compliance percentages, and engineer resolution rankings.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-dark-card border border-dark-border rounded-xl text-xs font-semibold text-slate-200 hover:bg-dark-surface shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-accent ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-bold shadow-md shadow-brand-primary/20 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export Telemetry
            </button>
          </div>
        </div>

        {/* Primary Operational Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-dark-muted">
              Total Incidents Logged
            </span>
            <div className="mt-3 text-3xl font-black text-white font-mono">
              {overview.totalTickets ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">All registered support requests</p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-dark-muted">
              Resolved & Closed
            </span>
            <div className="mt-3 text-3xl font-black text-emerald-400 font-mono">
              {overview.totalResolved ?? 0}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Successfully mitigated issues</p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-dark-muted">
              Mean Time to Resolution (MTTR)
            </span>
            <div className="mt-3 text-3xl font-black text-brand-accent font-mono">
              {overview.mttrFormatted || '0m'}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Average time to verified fix</p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-dark-muted">
              SLA Compliance
            </span>
            <div className="mt-3 text-3xl font-black text-cyan-400 font-mono">
              {overview.slaComplianceRate ?? 100}%
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {overview.slaMetCount ?? 0} in target vs {overview.slaBreachedCount ?? 0} breached
            </p>
          </div>
        </div>

        {/* Engineer Leaderboard */}
        <div className="bg-dark-card rounded-2xl border border-dark-border p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Support Engineer Resolution Leaderboard
              </h2>
              <p className="text-xs text-dark-muted mt-0.5">
                Staff performance ranked by total resolved incidents and average resolution efficiency.
              </p>
            </div>
            <span className="text-xs text-dark-muted font-mono">{leaderboard.length} staff members</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-dark-surface/90 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-dark-border">
                <tr>
                  <th className="px-5 py-3">Rank & Engineer</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3 text-center">Assigned Incidents</th>
                  <th className="px-5 py-3 text-center">Resolved Incidents</th>
                  <th className="px-5 py-3 text-right">Avg Resolution Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-dark-muted text-xs">
                      No engineer resolution activity logged yet.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((eng, idx) => (
                    <tr key={eng.id} className="hover:bg-dark-surface/50 transition">
                      <td className="px-5 py-4 font-medium text-white flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            idx === 0
                              ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                              : idx === 1
                              ? 'bg-slate-300/20 text-slate-300 border border-slate-300/40'
                              : 'bg-dark-surface text-slate-400 border border-dark-border'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span>{eng.name}</span>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-slate-400">{eng.email}</td>
                      <td className="px-5 py-4 text-center font-mono font-bold text-slate-200">
                        {eng.total_assigned}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          {eng.total_resolved}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-xs font-semibold text-brand-accent">
                        {eng.avg_formatted || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Volume Trends & Category Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Trends */}
          <div className="bg-dark-card rounded-2xl border border-dark-border p-6 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-accent" />
              Incident Velocity (Recent Days)
            </h2>

            {trends.length === 0 ? (
              <p className="text-xs text-dark-muted py-8 text-center">No trend history available.</p>
            ) : (
              <div className="space-y-3">
                {trends.map((t) => (
                  <div key={t.date} className="flex items-center justify-between p-3 rounded-xl bg-navy-900 border border-dark-border text-xs">
                    <span className="font-mono text-slate-300">{new Date(t.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-dark-muted text-[11px]">Daily volume:</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-dark-surface border border-dark-border font-mono font-bold text-white">
                        {t.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Performance */}
          <div className="bg-dark-card rounded-2xl border border-dark-border p-6 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-accent" />
              Category Resolution Efficiency
            </h2>

            <div className="space-y-3">
              {categories.length === 0 ? (
                <p className="text-xs text-dark-muted py-8 text-center">No category performance logged.</p>
              ) : (
                categories.map((c) => (
                  <div
                    key={c.category}
                    className="p-3 rounded-xl bg-navy-900 border border-dark-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{c.category}</p>
                      <p className="text-[11px] text-dark-muted mt-0.5">{c.count} total incidents</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-dark-muted uppercase block">Avg Resolution</span>
                      <span className="font-mono font-bold text-brand-accent">
                        {c.avg_resolution_mins > 60
                          ? `${Math.floor(c.avg_resolution_mins / 60)}h ${c.avg_resolution_mins % 60}m`
                          : `${c.avg_resolution_mins}m`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminAnalytics;
