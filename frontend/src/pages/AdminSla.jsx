import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { dashboardApi } from '../api/dashboardApi';
import { analyticsApi } from '../api/analyticsApi';
import {
  Sliders,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Edit2,
  Save,
  X,
  ShieldAlert,
  Info,
} from 'lucide-react';

const AdminSla = () => {
  const [configs, setConfigs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editingPriority, setEditingPriority] = useState(null);
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [slaRes, analyticsRes] = await Promise.all([
        dashboardApi.getSlaConfigs(),
        analyticsApi.getAnalytics()
      ]);

      if (slaRes.success) setConfigs(slaRes.data.configs || []);
      if (analyticsRes.success) setAnalytics(analyticsRes.data.overview || null);
    } catch (err) {
      console.error('Failed to load SLA policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (sla) => {
    setEditingPriority(sla.priority);
    setTargetMinutes(sla.target_minutes);
    setDescription(sla.description || '');
    setMessage('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await dashboardApi.updateSlaConfig({
        priority: editingPriority,
        targetMinutes: parseInt(targetMinutes, 10),
        description
      });

      if (res.success) {
        setMessage(`SLA policy for ${editingPriority} successfully updated to ${targetMinutes} minutes.`);
        setEditingPriority(null);
        fetchData();
      }
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to update SLA configuration.');
    } finally {
      setSaving(false);
    }
  };

  const priorityColor = {
    Critical: 'text-red-700 bg-red-50 border-red-200',
    High: 'text-orange-700 bg-orange-50 border-orange-200',
    Medium: 'text-amber-700 bg-amber-50 border-amber-200',
    Low: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Sliders className="w-6 h-6 text-sky-600" />
              Service Level Agreement (SLA) Policies
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure resolution time targets, automated breach calculation policies, and monitor team compliance.
            </p>
          </div>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* SLA Health Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Overall SLA Compliance
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {analytics.slaComplianceRate}%
                </span>
                <span className="text-xs text-slate-500 font-medium">resolved on time</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Within Target SLA
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600">
                  {analytics.slaMetCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">incidents</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                SLA Breached
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-red-600">
                  {analytics.slaBreachedCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">escalated incidents</span>
              </div>
            </div>
          </div>
        )}

        {/* Policy Configuration Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Priority Target Rules
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Info className="w-4 h-4 text-sky-600" />
              <span>Changes take effect immediately on incoming tickets</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Priority Level</th>
                  <th className="px-6 py-4">Target Resolution Time</th>
                  <th className="px-6 py-4">Policy Description</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {configs.map((sla) => (
                  <tr key={sla.priority} className="hover:bg-slate-50/75 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${priorityColor[sla.priority]}`}>
                        {sla.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800 text-sm">
                      {sla.target_minutes < 60
                        ? `${sla.target_minutes} Minutes`
                        : `${(sla.target_minutes / 60).toFixed(sla.target_minutes % 60 === 0 ? 0 : 1)} Hours (${sla.target_minutes}m)`}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-md">
                      {sla.description || 'Standard operational resolution window.'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {new Date(sla.updated_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(sla)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Target
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editingPriority && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Update SLA Target: {editingPriority}
                </h3>
                <button
                  onClick={() => setEditingPriority(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Define the target resolution threshold in minutes. This target governs countdown timers and breach calculations.
              </p>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Target Minutes *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(e.target.value)}
                    className="mt-1 block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                  <span className="block mt-1 text-[11px] text-slate-400">
                    {targetMinutes >= 60 && `Approx ${(targetMinutes / 60).toFixed(1)} hours`}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Policy Description
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Production outages and security breaches"
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
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminSla;
