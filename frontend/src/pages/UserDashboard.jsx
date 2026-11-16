import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import StatCard from '../components/StatCard';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import {
  PlusCircle,
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        ticketApi.getTickets({ limit: 10 }),
        dashboardApi.getStats()
      ]);

      if (ticketsRes.success) setTickets(ticketsRes.data.tickets || []);
      if (statsRes.success) setStats(statsRes.data.summary || {});
    } catch (err) {
      console.error('Failed to load user tickets:', err);
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">IT Support & Service Portal</h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back, <strong className="text-slate-800">{user?.name}</strong>. Submit support requests, monitor triage status, and review resolutions.
            </p>
          </div>
          <Link
            to="/user/create-incident"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-sm text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Raise New Incident
          </Link>
        </div>

        {/* Metric Cards (Clickable) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/user/incidents">
            <StatCard
              title="My Total Tickets"
              count={stats.total}
              icon={LifeBuoy}
              color="blue"
              subtitle="All submitted requests"
            />
          </Link>
          <Link to="/user/incidents?status=In+Progress">
            <StatCard
              title="Under Triage"
              count={(stats.open || 0) + (stats.assigned || 0) + (stats.in_progress || 0)}
              icon={Clock}
              color="indigo"
              subtitle="Actively investigated"
            />
          </Link>
          <Link to="/user/incidents?status=Resolved">
            <StatCard
              title="Resolved"
              count={stats.resolved}
              icon={CheckCircle2}
              color="emerald"
              subtitle="Ready for closure"
            />
          </Link>
          <Link to="/user/incidents">
            <StatCard
              title="SLA Breached"
              count={stats.overdue}
              icon={AlertOctagon}
              color="red"
              alert={stats.overdue > 0}
              subtitle="Priority escalations"
            />
          </Link>
        </div>

        {/* Quick Raise Banner */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Fast Track Support
            </div>
            <h2 className="text-lg font-bold">Experiencing an infrastructure or access outage?</h2>
            <p className="text-xs text-sky-100 max-w-xl">
              Submit an incident with Critical priority to trigger an immediate 15-minute response SLA.
            </p>
          </div>
          <Link
            to="/user/create-incident"
            className="self-start sm:self-auto px-4 py-2 bg-white text-sky-800 rounded-xl text-xs font-bold hover:bg-sky-50 shadow-sm transition"
          >
            Create Incident Now
          </Link>
        </div>

        {/* Recent Tickets Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Support Requests</h2>
            <Link to="/user/incidents" className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1">
              View All My Incidents
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <TicketTable
            tickets={tickets}
            loading={loading}
            showAssignee={true}
            emptyMessage="You have not created any support tickets yet. Click 'Raise New Incident' to submit one."
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default UserDashboard;
