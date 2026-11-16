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
  PlusCircle,
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Sparkles,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, assigned: 0, in_progress: 0, resolved: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [ticketsRes, statsRes] = await Promise.all([
        ticketApi.getTickets({ limit: 10 }),
        dashboardApi.getStats(),
      ]);

      if (ticketsRes.success) setTickets(ticketsRes.data.tickets || []);
      if (statsRes.success) setStats(statsRes.data.summary || {});

      if (isManual) toast.success('Your support tickets updated from database.');
    } catch (err) {
      console.error('Failed to load user tickets:', err);
      toast.error('Failed to load support dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Self-Service Portal
              </span>
              <span className="text-xs text-dark-muted font-mono">• IT Support Services</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Customer IT Support & Service Desk
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Welcome back, <strong className="text-white">{user?.name}</strong>. Submit support requests, monitor engineer investigations, and verify resolutions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-dark-card border border-dark-border rounded-xl text-xs font-semibold text-slate-200 hover:bg-dark-surface shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-accent ${refreshing ? 'animate-spin' : ''}`} />
              Sync
            </button>

            <Link
              to="/user/create-incident"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg shadow-brand-primary/20 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primaryHover transition"
            >
              <PlusCircle className="w-4 h-4" />
              Raise New Incident
            </Link>
          </div>
        </div>

        {/* Metric Cards (Clickable) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/user/incidents">
            <StatCard
              title="My Total Tickets"
              count={stats.total}
              icon={LifeBuoy}
              color="blue"
              subtitle="All your submitted requests"
            />
          </Link>
          <Link to="/user/incidents?status=In+Progress">
            <StatCard
              title="Under Triage"
              count={(stats.open || 0) + (stats.assigned || 0) + (stats.in_progress || 0)}
              icon={Clock}
              color="cyan"
              subtitle="Currently being investigated"
            />
          </Link>
          <Link to="/user/incidents?status=Resolved">
            <StatCard
              title="Resolved"
              count={stats.resolved}
              icon={CheckCircle2}
              color="emerald"
              subtitle="Ready for your closure verification"
            />
          </Link>
          <Link to="/user/incidents">
            <StatCard
              title="SLA Breached"
              count={stats.overdue}
              icon={AlertOctagon}
              color="red"
              alert={stats.overdue > 0}
              subtitle="Escalated to senior engineering"
            />
          </Link>
        </div>

        {/* Quick Raise Banner */}
        <div className="bg-gradient-to-r from-brand-primary to-blue-700 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-blue-400/20">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              Rapid Assistance
            </div>
            <h3 className="text-lg font-bold text-white">Experiencing a service interruption?</h3>
            <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
              Log an incident with high severity to instantly notify on-call support engineers. Target resolution SLA applies automatically based on priority.
            </p>
          </div>

          <Link
            to="/user/create-incident"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-navy-950 font-extrabold text-xs rounded-xl shadow-lg hover:bg-slate-100 transition flex-shrink-0"
          >
            Create Ticket Now
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Recent Tickets Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">My Active Support Incidents</h2>
              <p className="text-xs text-dark-muted">Track live progress, assigned engineers, and SLA countdowns</p>
            </div>
            <Link
              to="/user/incidents"
              className="text-xs text-brand-accent hover:text-white font-semibold transition flex items-center gap-1"
            >
              View Full Incident Ledger &rarr;
            </Link>
          </div>

          <TicketTable
            tickets={tickets}
            loading={loading}
            showAssignee={true}
            emptyMessage="You haven't submitted any support incidents yet. Click 'Raise New Incident' to log a request."
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default UserDashboard;
