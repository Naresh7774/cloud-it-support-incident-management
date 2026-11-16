import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import StatCard from '../components/StatCard';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import {
  UserCheck,
  Inbox,
  Flame,
  AlertOctagon,
  CheckCircle2,
  ArrowRight,
  Layers,
} from 'lucide-react';

const EngineerDashboard = () => {
  const { user } = useAuth();
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, assigned: 0, in_progress: 0, resolved: 0, overdue: 0, critical_active: 0 });
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [assignedRes, unassignedRes, statsRes] = await Promise.all([
        ticketApi.getTickets({ queue: 'mine', limit: 10 }),
        ticketApi.getTickets({ queue: 'unassigned', limit: 1 }),
        dashboardApi.getStats()
      ]);

      if (assignedRes.success) setAssignedTickets(assignedRes.data.tickets || []);
      if (unassignedRes.success) setUnassignedCount(unassignedRes.data.pagination?.total || 0);
      if (statsRes.success) setStats(statsRes.data.summary || {});
    } catch (err) {
      console.error('Failed to load engineer dashboard data:', err);
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Engineer Triage Desk</h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back, <strong className="text-slate-800">{user?.name}</strong>. Monitor your active queue, pick up new incidents, and resolve tickets within SLA targets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/engineer/unassigned"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-sky-600 text-white rounded-lg hover:bg-sky-700 shadow-sm transition"
            >
              <Inbox className="w-3.5 h-3.5" />
              Pickup New Incidents ({unassignedCount})
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
              subtitle="Available for pickup"
            />
          </Link>

          <Link to="/engineer/assigned">
            <StatCard
              title="SLA Breached"
              count={stats.overdue}
              icon={AlertOctagon}
              color="red"
              alert={stats.overdue > 0}
              subtitle="Requires immediate focus"
            />
          </Link>

          <Link to="/engineer/history">
            <StatCard
              title="My Resolved"
              count={stats.resolved}
              icon={CheckCircle2}
              color="emerald"
              subtitle="Historical mitigations"
            />
          </Link>
        </div>

        {/* Action Hub */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block">
                Unassigned Queue
              </span>
              <p className="text-xs text-sky-700 mt-1">
                There are <strong className="font-bold">{unassignedCount} unassigned incidents</strong> waiting for support triage.
              </p>
            </div>
            <Link
              to="/engineer/unassigned"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-sky-300 text-sky-800 rounded-lg text-xs font-bold hover:bg-sky-100 transition shadow-xs"
            >
              Open Queue
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Activity Audit History
              </span>
              <p className="text-xs text-slate-600 mt-1">
                Review your historical triage updates, internal notes, and resolutions.
              </p>
            </div>
            <Link
              to="/engineer/history"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-50 transition shadow-xs"
            >
              View History
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Assigned Incidents Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">My Active Assigned Incidents</h2>
            <Link to="/engineer/assigned" className="text-xs text-sky-600 hover:text-sky-800 font-semibold">
              View All Assigned &rarr;
            </Link>
          </div>
          <TicketTable
            tickets={assignedTickets}
            loading={loading}
            showAssignee={false}
            emptyMessage="No incidents currently assigned to you. Pick up an incident from the Unassigned Queue!"
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default EngineerDashboard;
