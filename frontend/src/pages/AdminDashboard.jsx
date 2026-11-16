import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import StatCard from '../components/StatCard';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { dashboardApi } from '../api/dashboardApi';
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
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    summary: { total: 0, open: 0, assigned: 0, in_progress: 0, resolved: 0, closed: 0, overdue: 0, critical_active: 0 },
    byPriority: [],
    byCategory: [],
  });
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        dashboardApi.getStats(),
        ticketApi.getTickets({ limit: 10 })
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (ticketsRes.success) setRecentIncidents(ticketsRes.data.tickets || []);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const summary = stats.summary || {};

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Incident Command Center</h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time enterprise support oversight, team workload, and SLA performance metrics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/incidents"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-sky-600 text-white rounded-lg hover:bg-sky-700 shadow-sm transition"
            >
              All Incidents
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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
              subtitle="All time tickets"
            />
          </Link>
          <Link to="/admin/incidents?status=Open">
            <StatCard
              title="Open Queue"
              count={summary.open}
              icon={Clock}
              color="indigo"
              subtitle="Awaiting assignment"
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
              subtitle="Awaiting closure"
            />
          </Link>
          <Link to="/admin/incidents?isOverdue=true">
            <StatCard
              title="Overdue (Breached)"
              count={summary.overdue}
              icon={AlertOctagon}
              color="red"
              alert={summary.overdue > 0}
              subtitle="Breached SLA"
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

        {/* Quick Hub Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to="/admin/sla"
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-600">
                <Sliders className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900">SLA Policy Configuration</h3>
            <p className="mt-1 text-xs text-slate-500">
              Manage target resolution windows for Critical (15m), High (1h), Medium (4h), and Low (8h).
            </p>
          </Link>

          <Link
            to="/admin/analytics"
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-100 text-sky-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900">Analytics & Performance Reports</h3>
            <p className="mt-1 text-xs text-slate-500">
              Review MTTR, SLA compliance percentage, team resolution leaderboard, and volume trends.
            </p>
          </Link>

          <Link
            to="/admin/users"
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900">User & Role Administration</h3>
            <p className="mt-1 text-xs text-slate-500">
              Assign roles, control administrative privileges, and manage engineer team memberships.
            </p>
          </Link>
        </div>

        {/* Priority & Category Overview Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Incidents by Priority
            </h3>
            <div className="space-y-3">
              {(stats.byPriority || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No priority metrics recorded yet.</p>
              ) : (
                stats.byPriority.map((row) => (
                  <div key={row.priority} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{row.priority}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            row.priority === 'Critical'
                              ? 'bg-red-500'
                              : row.priority === 'High'
                              ? 'bg-orange-500'
                              : row.priority === 'Medium'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (row.count / (summary.total || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 w-6 text-right">{row.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Incidents by Service Category
            </h3>
            <div className="space-y-3">
              {(stats.byCategory || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No category metrics recorded yet.</p>
              ) : (
                stats.byCategory.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600 truncate max-w-[200px]">{cat.category}</span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {cat.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Incidents Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent System Incidents</h2>
            <Link to="/admin/incidents" className="text-xs text-sky-600 hover:text-sky-800 font-semibold">
              View All &rarr;
            </Link>
          </div>
          <TicketTable
            tickets={recentIncidents}
            loading={loading}
            showAssignee={true}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
