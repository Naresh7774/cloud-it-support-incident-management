import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { settingsApi } from '../api/settingsApi';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    system_name: '',
    support_email: '',
    auto_assignment: 'false',
    sla_escalation_minutes: '15',
    maintenance_mode: 'false',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
        setError(typeof err === 'string' ? err : 'Failed to load system settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setMessage('');
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await settingsApi.updateSettings(settings);
      if (res.success) {
        setMessage('System settings saved and applied successfully.');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-sky-600" />
            Platform & System Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global configuration for portal branding, incident triage routing, and alert policies.
          </p>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* General Branding Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Branding & Contact
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                System Display Name
              </label>
              <input
                type="text"
                required
                value={settings.system_name || ''}
                onChange={(e) => handleChange('system_name', e.target.value)}
                className="mt-1 block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Primary Support Desk Email
              </label>
              <input
                type="email"
                required
                value={settings.support_email || ''}
                onChange={(e) => handleChange('support_email', e.target.value)}
                className="mt-1 block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Incident Routing & Automation */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Triage & SLA Routing Rules
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Automated Incident Assignment
              </label>
              <select
                value={settings.auto_assignment || 'false'}
                onChange={(e) => handleChange('auto_assignment', e.target.value)}
                className="mt-1 block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
              >
                <option value="false">Manual Triage & Engineer Self-Assignment (Default)</option>
                <option value="true">Auto-Assign to Available Support Engineer with Lowest Active Queue</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-400">
                When enabled, incoming open tickets are automatically assigned to eligible on-duty engineers.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                SLA Early Escalation Window (Minutes Before Breach)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                required
                value={settings.sla_escalation_minutes || '15'}
                onChange={(e) => handleChange('sla_escalation_minutes', e.target.value)}
                className="mt-1 block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 font-mono"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Triggers an urgent notification alert to engineers and administrators prior to SLA breach.
              </p>
            </div>
          </div>

          {/* System Operations */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              System Operations
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 uppercase">Maintenance Mode Banner</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Display scheduled maintenance notice on the client submission portal.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenance_mode === 'true'}
                onChange={(e) => handleChange('maintenance_mode', e.target.checked ? 'true' : 'false')}
                className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default AdminSettings;
