import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import {
  Inbox,
  UserCheck,
  CheckCircle2,
  AlertOctagon,
  Flame,
  Clock,
  Layers,
} from 'lucide-react';

const EngineerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('mine'); // 'mine', 'unassigned', 'all'
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, assigned: 0, in_progress: 0, resolved: 0, overdue: 0, critical_active: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        ticketApi.getTickets({ queue: activeTab }),
        dashboardApi.getStats()
      ]);

      if (ticketsRes.success) {
        setTickets(ticketsRes.data.tickets || []);
      }
      if (statsRes.success) {
        setStats(statsRes.data.summary || {});
      }
    } catch (err) {
      console.error('Failed to load engineer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Engineer Triage Desk</h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span>. Manage your incident queue, prevent SLA breaches, and apply resolutions.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            Refresh Queue
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="My Active Assigned"
            count={(stats.assigned || 0) + (stats.in_progress || 0)}
            icon={UserCheck}
            color="indigo"
            subtitle="Tickets in your workload"
          />
          <StatCard
            title="Critical Open Outages"
            count={stats.critical_active}
            icon={Flame}
            color="red"
            alert={stats.critical_active > 0}
            subtitle="Immediate 15m SLA focus"
          />
          <StatCard
            title="Overdue Incidents"
            count={stats.overdue}
            icon={AlertOctagon}
            color="red"
            alert={stats.overdue > 0}
            subtitle="Breached SLA deadlines"
          />
          <StatCard
            title="Resolved Incidents"
            count={stats.resolved}
            icon={CheckCircle2}
            color="emerald"
            subtitle="Awaiting client closure"
          />
        </div>

        {/* Queue Tabs */}
        <div className="flex border-b border-slate-200 mb-6 space-x-8">
          <button
            onClick={() => setActiveTab('mine')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'mine'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Assigned to Me
          </button>

          <button
            onClick={() => setActiveTab('unassigned')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'unassigned'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Unassigned Queue
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'all'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            All Active Incidents
          </button>
        </div>

        {/* Queue Table */}
        <TicketTable
          tickets={tickets}
          loading={loading}
          showAssignee={activeTab !== 'mine'}
          emptyMessage={
            activeTab === 'mine'
              ? 'No tickets currently assigned to you. Pick an incident from the Unassigned Queue!'
              : activeTab === 'unassigned'
              ? 'Unassigned queue is empty. Great job!'
              : 'No incidents found in system.'
          }
        />
      </main>
    </div>
  );
};

export default EngineerDashboard;
