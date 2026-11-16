import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { dashboardApi } from '../api/dashboardApi';
import { analyticsApi } from '../api/analyticsApi';
import { useToast } from '../context/ToastContext';
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
  Shield,
  Zap,
} from 'lucide-react';

const AdminSla = () => {
  const toast = useToast();
  const [configs, setConfigs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editingPriority, setEditingPriority] = useState(null);
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [slaRes, analyticsRes] = await Promise.all([
        dashboardApi.getSlaConfigs(),
        analyticsApi.getAnalytics(),
      ]);

      if (slaRes.success) setConfigs(slaRes.data.configs || []);
      if (analyticsRes.success) setAnalytics(analyticsRes.data.overview || null);
    } catch (err) {
      console.error('Failed to load SLA policies:', err);
      toast.error('Failed to load SLA policies from database.');
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
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await dashboardApi.updateSlaConfig({
        priority: editingPriority,
        targetMinutes: parseInt(targetMinutes, 10),
        description,
      });

      if (res.success) {
        toast.success(`SLA for ${editingPriority} updated to ${targetMinutes} minutes.`);
        setEditingPriority(null);
        fetchData();
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update SLA configuration.');
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} minutes`;
    const hrs = Math.floor(mins / 60);
    const remainder = mins % 60;
    return remainder > 0 ? `${hrs}h ${remainder}m` : `${hrs} hour${hrs > 1 ? 's' : ''}`;
  };

  const priorityTheme = {
    Critical: {
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      accent: 'text-rose-400',
    },
    High: {
      border: 'border-orange-500/30',
      badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      accent: 'text-orange-400',
    },
    Medium: {
      border: 'border-amber-500/30',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      accent: 'text-amber-400',
    },
    Low: {
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      accent: 'text-emerald-400',
    },
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-accent border border-brand-primary/20">
                Service Level Agreements
              </span>
              <span className="text-xs text-dark-muted font-mono">• Configurable Response Targets</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Sliders className="w-6 h-6 text-brand-accent" />
              SLA Policy Configuration
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Set and modify contractual resolution deadlines per severity. Updates immediately recalculate active ticket windows.
            </p>
          </div>
        </div>

        {/* SLA Health KPI Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-dark-muted">
                  Compliance Ratio
                </span>
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{analytics.slaComplianceRate}%</span>
                <span className="text-xs text-emerald-400 font-semibold">In Target</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {analytics.slaMetCount} tickets resolved within deadline
              </p>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-dark-muted">
                  SLA Breached Incidents
                </span>
                <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                  <AlertOctagon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{analytics.slaBreachedCount}</span>
                {analytics.slaBreachedCount > 0 && (
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full uppercase">
                    Breached
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">Escalated incidents exceeding resolution window</p>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-dark-muted">
                  Target Resolution MTTR
                </span>
                <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-accent border border-brand-primary/20">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{analytics.mttrFormatted}</span>
                <span className="text-xs text-brand-accent font-semibold">Average</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Historical mean time to ticket resolution</p>
            </div>
          </div>
        )}

        {/* Policy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading ? (
            <div className="col-span-4 py-16 text-center text-dark-muted">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-primary/20 border-b-brand-primary"></div>
              <p className="mt-2 text-xs">Loading SLA configurations from database...</p>
            </div>
          ) : (
            configs.map((sla) => {
              const theme = priorityTheme[sla.priority] || priorityTheme.Medium;
              return (
                <div
                  key={sla.priority}
                  className={`bg-dark-card rounded-2xl border ${theme.border} p-6 shadow-xl flex flex-col justify-between hover:bg-dark-surface/60 transition group`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.badge}`}>
                        {sla.priority} Severity
                      </span>
                      <button
                        onClick={() => handleEdit(sla)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-surface transition"
                        title="Edit Policy"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="text-3xl font-black text-white font-mono">
                        {formatDuration(sla.target_minutes)}
                      </div>
                      <span className="text-xs text-dark-muted font-mono">
                        ({sla.target_minutes} minutes)
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-300 leading-relaxed min-h-[48px]">
                      {sla.description || 'Target response and resolution window.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-dark-border/80 flex items-center justify-between text-xs">
                    <span className="text-dark-muted font-mono text-[11px]">
                      Updated {new Date(sla.updated_at || Date.now()).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleEdit(sla)}
                      className="text-brand-accent hover:text-white font-semibold transition flex items-center gap-1 text-xs"
                    >
                      Configure &rarr;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* SLA Architecture Info Banner */}
        <div className="bg-navy-950 rounded-2xl border border-dark-border p-5 flex items-start gap-4">
          <Info className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <h4 className="font-bold text-white text-sm">Dynamic SLA Calculation Architecture</h4>
            <p className="leading-relaxed text-dark-muted">
              SLA deadlines are calculated synchronously using server UTC timestamps:
              <code className="mx-1 px-1.5 py-0.5 rounded bg-navy-900 border border-dark-border text-brand-accent font-mono text-[11px]">
                sla_deadline = created_at + INTERVAL target_minutes MINUTE
              </code>.
              When an administrator updates a priority threshold, subsequent incident creations immediately apply the new contract window.
            </p>
          </div>
        </div>

        {/* Edit Modal Dialog */}
        {editingPriority && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-dark-card border border-dark-border rounded-2xl shadow-2xl max-w-md w-full p-6 text-dark-light animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-dark-border">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-brand-accent" />
                  <h3 className="text-base font-bold text-white">
                    Modify {editingPriority} SLA Policy
                  </h3>
                </div>
                <button
                  onClick={() => setEditingPriority(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-surface transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Target Resolution Window (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10080"
                    required
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary font-mono"
                  />
                  <p className="text-[11px] text-dark-muted mt-1">
                    Equivalent: <strong className="text-white">{formatDuration(parseInt(targetMinutes, 10) || 0)}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Policy Description & Scope
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="pt-3 border-t border-dark-border flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingPriority(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-dark-surface hover:bg-dark-hover transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-brand-primaryHover shadow-md transition disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-b-white" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Save Policy Changes
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
