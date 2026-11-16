import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { dashboardApi } from '../api/dashboardApi';
import { PlusCircle, LifeBuoy, Clock, CheckCircle2, AlertOctagon } from 'lucide-react';

const UserDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        ticketApi.getTickets(),
        dashboardApi.getStats()
      ]);

      if (ticketsRes.success) {
        setTickets(ticketsRes.data.tickets || []);
      }
      if (statsRes.success) {
        setStats(statsRes.data.summary || {});
      }
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Support Tickets</h1>
            <p className="text-sm text-slate-500 mt-1">
              Create, track, and collaborate on your active IT service requests and incidents.
            </p>
          </div>
          <Link
            to="/create-ticket"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-sm text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Raise New Incident
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Tickets"
            count={stats.total}
            icon={LifeBuoy}
            color="blue"
            subtitle="Raised by you"
          />
          <StatCard
            title="Active / In Progress"
            count={(stats.open || 0) + (stats.assigned || 0) + (stats.in_progress || 0)}
            icon={Clock}
            color="indigo"
            subtitle="Under engineer triage"
          />
          <StatCard
            title="Resolved Incidents"
            count={stats.resolved}
            icon={CheckCircle2}
            color="emerald"
            subtitle="Ready to verify & close"
          />
          <StatCard
            title="SLA Breached"
            count={stats.overdue}
            icon={AlertOctagon}
            color="red"
            alert={stats.overdue > 0}
            subtitle="Escalated to engineering lead"
          />
        </div>

        {/* Tickets Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Submitted Incidents</h2>
            <button
              onClick={fetchData}
              className="text-xs text-sky-600 hover:text-sky-800 font-medium"
            >
              Refresh Table
            </button>
          </div>

          <TicketTable
            tickets={tickets}
            loading={loading}
            showAssignee={true}
            emptyMessage="You have not created any support tickets yet. Click 'Raise New Incident' to submit one."
          />
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
