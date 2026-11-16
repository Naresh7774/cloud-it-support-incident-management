import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { ticketApi } from '../api/ticketApi';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert,
  AlertCircle,
  Send,
  Clock,
  ArrowLeft,
  Tag,
  FileText,
  Layers,
  Zap,
} from 'lucide-react';

const CATEGORIES = [
  'Cloud/Infrastructure',
  'Network & VPN',
  'Database & Storage',
  'Security & Compliance',
  'Software & APIs',
  'Hardware & Peripherals',
  'Access & Permissions',
  'Other',
];

const SLA_TARGETS = {
  Critical: '15 Minutes (Emergency outage escalation)',
  High: '1 Hour (Major service impairment)',
  Medium: '4 Hours (Standard operational issue)',
  Low: '8 Hours (General inquiry or minor issue)',
};

const CreateIncident = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle || !trimmedDesc) {
      setError('Please provide both an incident title and a detailed description.');
      return;
    }

    setLoading(true);

    try {
      const res = await ticketApi.createTicket({
        title: trimmedTitle,
        description: trimmedDesc,
        category,
        priority,
      });

      if (res.success && res.data?.ticket) {
        toast.success(`Incident ${res.data.ticket.ticket_number} logged successfully.`);
        navigate(`/user/incidents/${res.data.ticket.id}`);
      }
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to create incident. Please verify inputs.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-accent border border-brand-primary/20">
              New Ticket Dispatch
            </span>
            <span className="text-xs text-dark-muted font-mono">• Direct Engineer Notification</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-brand-accent" />
            Raise Support Incident
          </h1>
          <p className="text-xs text-dark-muted mt-1">
            Provide complete incident details to accelerate triage and resolution by our support engineers.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-dark-card rounded-2xl shadow-xl border border-dark-border overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {error && (
              <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-accent" />
                Incident Title *
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Production API Gateway returning 502 Bad Gateway"
                className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition"
              />
            </div>

            {/* Category and Priority Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-accent" />
                  Service Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary transition cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-navy-950 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-brand-accent" />
                  Severity Priority *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary transition cursor-pointer"
                >
                  <option value="Critical" className="bg-navy-950 text-rose-400 font-bold">Critical (15m Response)</option>
                  <option value="High" className="bg-navy-950 text-orange-400 font-bold">High (1h Response)</option>
                  <option value="Medium" className="bg-navy-950 text-amber-300 font-bold">Medium (4h Response)</option>
                  <option value="Low" className="bg-navy-950 text-emerald-400 font-bold">Low (8h Response)</option>
                </select>
              </div>
            </div>

            {/* Dynamic SLA Policy Target Notice */}
            <div className="p-4 bg-navy-900 rounded-xl border border-dark-border flex items-start gap-3">
              <Clock className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-white block">
                  Contractual SLA Target for {priority} Severity:
                </span>
                <span className="text-slate-300 mt-0.5 block font-mono text-[11px]">
                  {SLA_TARGETS[priority]}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Detailed Incident Description *
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include error codes, affected services, steps to reproduce, and impact on operations..."
                className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-dark-border flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-primary/20 transition disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-b-white" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Submit Incident Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateIncident;
