import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import StatCard from '../components/StatCard';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  UserCheck,
  Inbox,
  Flame,
  AlertOctagon,
  CheckCircle2,
  ArrowRight,
  Layers,
  RefreshCw,
  History,
  Zap,
} from 'lucide-react';

const EngineerDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, assigned: 0, in_progress: 0, resolved: 0, overdue: 0, critical_active: 0 });
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [assignedRes, unassignedRes, statsRes] = await Promise.all([
        ticketApi.getTickets({ queue: 'assigned', limit: 10 }),
        ticketApi.getTickets({ queue: 'unassigned', limit: 1 }),
        dashboardApi.getStats(),
      ]);

      if (assignedRes.success) setAssignedTickets(assignedRes.data.tickets || []);
      if (unassignedRes.success) setUnassignedCount(unassignedRes.data.pagination?.total || 0);
      if (statsRes.success) setStats(statsRes.data.summary || {});

      if (isManual) toast.success('Engineer workload updated from MySQL.');
    } catch (err) {
      console.error('Failed to load engineer dashboard data:', err);
      toast.error('Failed to refresh triage desk.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                Support Engineering Desk
              </span>
              <span className="text-xs text-dark-muted font-mono">• Active Triage Shift</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Support Engineer Triage Desk
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Welcome back, <strong className="text-white">{user?.name}</strong>. Monitor your active queue, pick up new incidents, and triage within SLA targets.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-dark-card border border-dark-border rounded-xl text-xs font-semibold text-slate-200 hover:bg-dark-surface shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-accent ${refreshing ? 'animate-spin' : ''}`} />
              Sync
            </button>

            <Link
              to="/engineer/unassigned"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-brand-primary text-white rounded-xl hover:bg-brand-primaryHover shadow-lg shadow-brand-primary/20 transition"
            >
              <Inbox className="w-3.5 h-3.5" />
              Pickup Queue ({unassignedCount})
            </Link>
          </div>
        </div>

        {/* Metrics Grid (Clickable Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/engineer/assigned">
            <StatCard
              title="Assigned to Me"
              count={(stats.assigned || 0) + (stats.in_progress || 0)}
              icon={UserCheck}
              color="indigo"
              subtitle="Active workload queue"
            />
          </Link>

          <Link to="/engineer/unassigned">
            <StatCard
              title="Unassigned Pool"
              count={unassignedCount}
              icon={Inbox}
              color="blue"
              alert={unassignedCount > 0}
              subtitle="Available for immediate pickup"
            />
          </Link>

          <Link to="/engineer/assigned">
            <StatCard
              title="SLA Breached"
              count={stats.overdue}
              icon={AlertOctagon}
              color="red"
              alert={stats.overdue > 0}
              subtitle="Requires priority mitigation"
            />
          </Link>

          <Link to="/engineer/history">
            <StatCard
              title="My Resolved"
              count={stats.resolved}
              icon={CheckCircle2}
              color="emerald"
              subtitle="Verified historical closures"
            />
          </Link>
        </div>

        {/* Quick Action Hub */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent">
                Queue Telemetry
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">Unassigned Incident Pool</h3>
              <p className="text-xs text-dark-muted mt-1 max-w-sm">
                There are currently <strong className="text-brand-accent">{unassignedCount}</strong> unassigned support incidents waiting for triage.
              </p>
            </div>
            <Link
              to="/engineer/unassigned"
              className="px-3.5 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-bold shadow-md shadow-brand-primary/20 transition flex items-center gap-1.5 flex-shrink-0"
            >
              Browse Pool
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Audit Trail
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">My Incident Action History</h3>
              <p className="text-xs text-dark-muted mt-1 max-w-sm">
                Review your historical mitigation notes, status transitions, and resolution velocity.
              </p>
            </div>
            <Link
              to="/engineer/history"
              className="px-3.5 py-2 bg-dark-surface hover:bg-dark-hover text-slate-200 border border-dark-border rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
            >
              <History className="w-3.5 h-3.5" />
              View Ledger
            </Link>
          </div>
        </div>

        {/* Assigned Incidents Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Active Assigned Queue</h2>
              <p className="text-xs text-dark-muted">Incidents currently assigned to you awaiting mitigation or resolution</p>
            </div>
            <Link
              to="/engineer/assigned"
              className="text-xs text-brand-accent hover:text-white font-semibold transition flex items-center gap-1"
            >
              View All Assigned ({assignedTickets.length}) &rarr;
            </Link>
          </div>

          <TicketTable
            tickets={assignedTickets}
            loading={loading}
            showAssignee={false}
            emptyMessage="You have no active incidents assigned. Check the unassigned pool to pick up tickets."
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default EngineerDashboard;
