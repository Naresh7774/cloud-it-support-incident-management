import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { settingsApi } from '../api/settingsApi';
import { useToast } from '../context/ToastContext';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Bell,
  Mail,
  Zap,
  Lock,
} from 'lucide-react';

const AdminSettings = () => {
  const toast = useToast();
  const [settings, setSettings] = useState({
    system_name: 'Cloud IncidentOps ITSM',
    support_email: 'support@cloudsupport.local',
    auto_assignment: 'false',
    sla_escalation_minutes: '15',
    maintenance_mode: 'false',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await settingsApi.getSettings();
        if (res.success && res.data?.map) {
          setSettings((prev) => ({
            ...prev,
            ...res.data.map,
          }));
        }
      } catch (err) {
        toast.error('Failed to load system settings from database.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await settingsApi.updateSettings(settings);
      if (res.success) {
        toast.success('System settings saved and applied to MySQL database.');
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-accent border border-brand-primary/20">
              Platform Configuration
            </span>
            <span className="text-xs text-dark-muted font-mono">• Persisted in MySQL</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-brand-accent" />
            Platform & Governance Settings
          </h1>
          <p className="text-xs text-dark-muted mt-1">
            Configure enterprise support system parameters, notification thresholds, and automation policies.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-dark-muted bg-dark-card rounded-2xl border border-dark-border">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-primary/20 border-b-brand-primary"></div>
            <p className="mt-2 text-xs">Loading platform configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* General Settings Card */}
            <div className="bg-dark-card rounded-2xl p-6 border border-dark-border shadow-xl space-y-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-dark-border">
                <Shield className="w-4 h-4 text-brand-accent" />
                General System Identity
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Platform System Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.system_name || ''}
                    onChange={(e) => handleChange('system_name', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary"
                  />
                  <p className="text-[11px] text-dark-muted mt-1">Public name displayed on notifications & headers</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Central Operations Dispatch Email
                  </label>
                  <input
                    type="email"
                    required
                    value={settings.support_email || ''}
                    onChange={(e) => handleChange('support_email', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary"
                  />
                  <p className="text-[11px] text-dark-muted mt-1">Outbound routing for customer ticket updates</p>
                </div>
              </div>
            </div>

            {/* Automation & Escalation Card */}
            <div className="bg-dark-card rounded-2xl p-6 border border-dark-border shadow-xl space-y-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-dark-border">
                <Zap className="w-4 h-4 text-amber-400" />
                Automation & SLA Escalation Policies
              </h2>

              <div className="space-y-4">
                {/* Auto Assignment Toggle */}
                <div className="flex items-center justify-between p-4 bg-navy-900 rounded-xl border border-dark-border">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">Auto-Assign Incoming Incidents</span>
                    <span className="text-[11px] text-dark-muted">
                      Automatically route unassigned tickets to engineers based on active workload capacity
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        'auto_assignment',
                        settings.auto_assignment === 'true' ? 'false' : 'true'
                      )
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.auto_assignment === 'true' ? 'bg-brand-primary' : 'bg-dark-surface'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.auto_assignment === 'true' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* SLA Breach Warning Threshold */}
                <div className="p-4 bg-navy-900 rounded-xl border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">SLA Warning Advance Alert (Minutes)</span>
                    <span className="text-[11px] text-dark-muted">
                      Trigger engineer dashboard notification before an incident reaches breached status
                    </span>
                  </div>
                  <div className="w-32 flex-shrink-0">
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={settings.sla_escalation_minutes || '15'}
                      onChange={(e) => handleChange('sla_escalation_minutes', e.target.value)}
                      className="w-full px-3 py-1.5 bg-dark-card border border-dark-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-primary font-mono text-center"
                    />
                  </div>
                </div>

                {/* Maintenance Mode Toggle */}
                <div className="flex items-center justify-between p-4 bg-navy-900 rounded-xl border border-dark-border">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-rose-400 block flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Maintenance Mode Lockout
                    </span>
                    <span className="text-[11px] text-dark-muted">
                      Restricts incident submission and notifies users of an active platform maintenance window
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        'maintenance_mode',
                        settings.maintenance_mode === 'true' ? 'false' : 'true'
                      )
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.maintenance_mode === 'true' ? 'bg-rose-600' : 'bg-dark-surface'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.maintenance_mode === 'true' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-brand-primaryHover shadow-lg shadow-brand-primary/20 transition disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-b-white" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Platform Settings
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminSettings;
