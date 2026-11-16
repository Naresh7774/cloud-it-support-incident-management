import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import StatCard from '../components/StatCard';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { dashboardApi } from '../api/dashboardApi';
import { analyticsApi } from '../api/analyticsApi';
import { useToast } from '../context/ToastContext';
import {
  Layers,
  Clock,
  BarChart3,
  CheckCircle2,
  AlertOctagon,
  Flame,
  ArrowRight,
  Sliders,
  Users,
  TrendingUp,
  RefreshCw,
  Download,
  Calendar,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';

const AdminDashboard = () => {
  const toast = useToast();
  const [dateRange, setDateRange] = useState('all'); // 'all' | 'today' | '7d' | '30d'
  const [stats, setStats] = useState({
    summary: { total: 0, open: 0, assigned: 0, in_progress: 0, resolved: 0, closed: 0, overdue: 0, critical_active: 0 },
    byPriority: [],
    byCategory: [],
  });
  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [statsRes, analyticsRes, ticketsRes] = await Promise.all([
        dashboardApi.getStats({ dateRange: dateRange === 'all' ? undefined : dateRange }),
        analyticsApi.getAnalytics(),
        ticketApi.getTickets({ limit: 10 }),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (analyticsRes.success && analyticsRes.data) {
        setAnalyticsOverview(analyticsRes.data.overview || null);
      }
      if (ticketsRes.success) setRecentIncidents(ticketsRes.data.tickets || []);

      if (isManualRefresh) {
        toast.success('Admin metrics successfully updated with real-time MySQL data.');
      }
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
      toast.error('Failed to sync metrics from backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const summary = stats.summary || {};

  // Export Executive Summary to CSV
  const handleExportSummary = () => {
    const csvContent = [
      'Cloud IncidentOps - Executive Summary Report',
      `Generated At: ${new Date().toISOString()}`,
      `Date Range Filter: ${dateRange.toUpperCase()}`,
      '',
      'Metric,Count',
      `Total Incidents,${summary.total || 0}`,
      `Open Incidents,${summary.open || 0}`,
      `Assigned Incidents,${summary.assigned || 0}`,
      `In Progress Incidents,${summary.in_progress || 0}`,
      `Resolved Incidents,${summary.resolved || 0}`,
      `Closed Incidents,${summary.closed || 0}`,
      `Overdue / Breached SLA,${summary.overdue || 0}`,
      `Active Critical Outages,${summary.critical_active || 0}`,
      `SLA Compliance Rate,${analyticsOverview?.slaComplianceRate ?? 100}%`,
      `Mean Time to Resolution (MTTR),${analyticsOverview?.mttrFormatted || 'N/A'}`,
      '',
      'Priority,Count',
      ...(stats.byPriority || []).map((p) => `"${p.priority}",${p.count}`),
      '',
      'Category,Count',
      ...(stats.byCategory || []).map((c) => `"${c.category}",${c.count}`),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `executive_kpi_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Executive KPI report downloaded successfully.');
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header Hero Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
                Mission Critical
              </span>
              <span className="text-xs text-dark-muted font-mono">• Real-time MySQL Feed</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              Admin Incident Command Center
            </h1>
            <p className="text-xs text-dark-muted mt-1 max-w-2xl">
              Enterprise IT operational oversight, SLA enforcement telemetry, team throughput, and incident triage.
            </p>
          </div>

          {/* Controls: Date Filter, Refresh, Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Picker */}
            <div className="inline-flex items-center bg-dark-card border border-dark-border rounded-xl p-1 text-xs">
              <button
                onClick={() => setDateRange('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  dateRange === 'all'
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-dark-surface'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateRange('today')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  dateRange === 'today'
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-dark-surface'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRange('7d')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  dateRange === '7d'
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-dark-surface'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDateRange('30d')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  dateRange === '30d'
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-dark-surface'
                }`}
              >
                30 Days
              </button>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-dark-card hover:bg-dark-surface text-slate-200 border border-dark-border rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
              title="Refresh all metrics from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-accent ${refreshing ? 'animate-spin' : ''}`} />
              Sync
            </button>

            {/* Export Summary Button */}
            <button
              onClick={handleExportSummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-bold shadow-md shadow-brand-primary/20 transition"
              title="Download executive metrics report as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export Report
            </button>
          </div>
        </div>

        {/* Global Statistics Grid (Clickable Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link to="/admin/incidents">
            <StatCard
              title="Total Incidents"
              count={summary.total}
              icon={Layers}
              color="blue"
              subtitle="All registered tickets"
            />
          </Link>
          <Link to="/admin/incidents?status=Open">
            <StatCard
              title="Open Queue"
              count={summary.open}
              icon={Clock}
              color="cyan"
              subtitle="Pending assignment"
            />
          </Link>
          <Link to="/admin/incidents?status=In+Progress">
            <StatCard
              title="In Progress"
              count={summary.in_progress}
              icon={BarChart3}
              color="purple"
              subtitle="Under active triage"
            />
          </Link>
          <Link to="/admin/incidents?status=Resolved">
            <StatCard
              title="Resolved"
              count={summary.resolved}
              icon={CheckCircle2}
              color="emerald"
              subtitle="Verified fixes"
            />
          </Link>
          <Link to="/admin/incidents?isOverdue=true">
            <StatCard
              title="Overdue (Breached)"
              count={summary.overdue}
              icon={AlertOctagon}
              color="red"
              alert={summary.overdue > 0}
              subtitle="Breached SLA window"
            />
          </Link>
          <Link to="/admin/incidents?priority=Critical">
            <StatCard
              title="Active Critical"
              count={summary.critical_active}
              icon={Flame}
              color="red"
              alert={summary.critical_active > 0}
              subtitle="15m SLA outages"
            />
          </Link>
        </div>

        {/* Performance & Quality SLA Cards */}
        {analyticsOverview && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-dark-muted">
                  Overall SLA Compliance Rate
                </span>
                <div className="text-3xl font-black text-white">
                  {analyticsOverview.slaComplianceRate}%
                </div>
                <p className="text-[11px] text-slate-400">
                  {analyticsOverview.slaMetCount} tickets met within contractual target window
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Shield className="w-8 h-8" />
              </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-dark-muted">
                  Mean Time To Resolution (MTTR)
                </span>
                <div className="text-3xl font-black text-white">
                  {analyticsOverview.mttrFormatted}
                </div>
                <p className="text-[11px] text-slate-400">
                  Average resolution cycle from incident creation to verified mitigation
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/25 flex items-center justify-center text-brand-accent">
                <Activity className="w-8 h-8" />
              </div>
            </div>
          </div>
        )}

        {/* Breakdown Panels (Priority & Category) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Distribution */}
          <div className="bg-dark-card rounded-2xl p-6 border border-dark-border shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-accent" />
                Incident Priority Distribution
              </h2>
              <span className="text-xs text-dark-muted font-mono">{summary.total || 0} total</span>
            </div>

            <div className="space-y-3.5">
              {(stats.byPriority || []).length === 0 ? (
                <p className="text-xs text-dark-muted py-6 text-center">No recorded incidents for this filter.</p>
              ) : (
                stats.byPriority.map((p) => {
                  const pct = summary.total > 0 ? Math.round((p.count / summary.total) * 100) : 0;
                  const barColor = {
                    Critical: 'bg-rose-500',
                    High: 'bg-orange-500',
                    Medium: 'bg-amber-400',
                    Low: 'bg-emerald-500',
                  }[p.priority] || 'bg-brand-primary';

                  return (
                    <div key={p.priority} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-300">{p.priority} Priority</span>
                        <span className="text-white font-mono">
                          {p.count} <span className="text-dark-muted font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-navy-900 rounded-full overflow-hidden border border-dark-border">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-dark-card rounded-2xl p-6 border border-dark-border shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-accent" />
                Category Breakdown
              </h2>
              <span className="text-xs text-dark-muted font-mono">{(stats.byCategory || []).length} categories</span>
            </div>

            <div className="space-y-3">
              {(stats.byCategory || []).length === 0 ? (
                <p className="text-xs text-dark-muted py-6 text-center">No categories registered.</p>
              ) : (
                stats.byCategory.map((cat) => {
                  const pct = summary.total > 0 ? Math.round((cat.count / summary.total) * 100) : 0;
                  return (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-navy-900 border border-dark-border text-xs"
                    >
                      <span className="font-semibold text-slate-200 truncate max-w-[200px]">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-dark-muted font-mono">{pct}%</span>
                        <span className="font-bold text-white bg-dark-surface px-2.5 py-0.5 rounded-lg border border-dark-border">
                          {cat.count}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick Hub Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to="/admin/sla"
            className="p-5 bg-dark-card rounded-2xl border border-dark-border shadow-lg hover:border-brand-primary/50 hover:bg-dark-surface/60 transition group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                <Sliders className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-accent group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-white">SLA Policy Configuration</h3>
            <p className="mt-1 text-xs text-dark-muted leading-relaxed">
              Configure contractual resolution targets for Critical (15m), High (1h), Medium (4h), and Low (8h).
            </p>
          </Link>

          <Link
            to="/admin/analytics"
            className="p-5 bg-dark-card rounded-2xl border border-dark-border shadow-lg hover:border-brand-primary/50 hover:bg-dark-surface/60 transition group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-brand-primary/10 rounded-xl border border-brand-primary/20 text-brand-accent">
                <TrendingUp className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-accent group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-white">Analytics & Performance Reports</h3>
            <p className="mt-1 text-xs text-dark-muted leading-relaxed">
              Review MTTR, SLA compliance telemetry, engineer leaderboard, and ticket volume graphs.
            </p>
          </Link>

          <Link
            to="/admin/users"
            className="p-5 bg-dark-card rounded-2xl border border-dark-border shadow-lg hover:border-brand-primary/50 hover:bg-dark-surface/60 transition group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-accent group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-white">User & Role Administration</h3>
            <p className="mt-1 text-xs text-dark-muted leading-relaxed">
              Audit enterprise staff accounts, manage permission roles, and provision support engineers.
            </p>
          </Link>
        </div>

        {/* Recent Incidents Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Recent Enterprise Incidents</h2>
              <p className="text-xs text-dark-muted">Latest 10 support requests registered across all categories</p>
            </div>
            <Link
              to="/admin/incidents"
              className="text-xs text-brand-accent hover:text-white font-semibold transition flex items-center gap-1"
            >
              View Full Incident Ledger &rarr;
            </Link>
          </div>
          <TicketTable
            tickets={recentIncidents}
            loading={loading}
            showAssignee={true}
            emptyMessage="No recent incidents in the database."
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
