import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { dashboardApi } from '../api/dashboardApi';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Flame,
  Settings,
  Layers,
  Save,
  Edit2,
  Users,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    summary: { total: 0, open: 0, assigned: 0, in_progress: 0, resolved: 0, closed: 0, overdue: 0, critical_active: 0 },
    byPriority: [],
    byCategory: [],
    userBreakdown: []
  });
  const [tickets, setTickets] = useState([]);
  const [slaConfigs, setSlaConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  // SLA editing state
  const [editingPriority, setEditingPriority] = useState(null);
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [description, setDescription] = useState('');
  const [savingSla, setSavingSla] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, ticketsRes, slaRes] = await Promise.all([
        dashboardApi.getStats(),
        ticketApi.getTickets({ limit: 100 }),
        dashboardApi.getSlaConfigs()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (ticketsRes.success) setTickets(ticketsRes.data.tickets || []);
      if (slaRes.success) setSlaConfigs(slaRes.data.configs || []);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditSla = (config) => {
    setEditingPriority(config.priority);
    setTargetMinutes(config.target_minutes);
    setDescription(config.description || '');
  };

  const handleSaveSla = async (e) => {
    e.preventDefault();
    setSavingSla(true);
    try {
      const res = await dashboardApi.updateSlaConfig({
        priority: editingPriority,
        targetMinutes: parseInt(targetMinutes, 10),
        description
      });
      if (res.success) {
        setEditingPriority(null);
        fetchData();
      }
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to update SLA configuration.');
    } finally {
      setSavingSla(false);
    }
  };

  const summary = stats.summary || {};

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">IT Support & Incident Command</h1>
            <p className="text-sm text-slate-500 mt-1">
              Complete visibility into support SLA performance, incident backlogs, and engineering assignments.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="self-start sm:self-auto px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            Refresh Metrics
          </button>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Incidents"
            count={summary.total}
            icon={Layers}
            color="blue"
          />
          <StatCard
            title="Open / Unassigned"
            count={summary.open}
            icon={Clock}
            color="indigo"
          />
          <StatCard
            title="In Progress"
            count={summary.in_progress}
            icon={BarChart3}
            color="purple"
          />
          <StatCard
            title="Resolved"
            count={summary.resolved}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            title="Overdue (Breached)"
            count={summary.overdue}
            icon={AlertOctagon}
            color="red"
            alert={summary.overdue > 0}
          />
          <StatCard
            title="Active Critical"
            count={summary.critical_active}
            icon={Flame}
            color="red"
            alert={summary.critical_active > 0}
          />
        </div>

        {/* Analytical Panels: Priority, Category & Configurable SLA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
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
                    <span className="font-medium text-slate-600 truncate max-w-[150px]">{cat.category}</span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {cat.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Configurable SLA Targets Policy Manager */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-sky-600" />
                Configurable SLA Targets
              </h3>
            </div>
            <div className="space-y-3">
              {slaConfigs.map((sla) => (
                <div
                  key={sla.priority}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{sla.priority}: </span>
                    <span className="font-mono text-sky-700 font-semibold">
                      {sla.target_minutes < 60
                        ? `${sla.target_minutes} min`
                        : `${sla.target_minutes / 60} hr${sla.target_minutes > 60 ? 's' : ''}`}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                      {sla.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEditSla(sla)}
                    className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-white rounded-lg transition"
                    title="Edit SLA Target"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Incident Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">All System Incidents</h2>
            <span className="text-xs text-slate-500">Showing up to 100 recent incidents</span>
          </div>
          <TicketTable
            tickets={tickets}
            loading={loading}
            showAssignee={true}
          />
        </div>

        {/* SLA Edit Modal */}
        {editingPriority && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Configure SLA Target for {editingPriority}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Update the target resolution window in minutes. New incidents will inherit this policy.
              </p>

              <form onSubmit={handleSaveSla} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Target Resolution (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(e.target.value)}
                    className="mt-1 block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Policy Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingPriority(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSla}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Target
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
