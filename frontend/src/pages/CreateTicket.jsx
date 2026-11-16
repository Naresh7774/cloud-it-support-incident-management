import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ticketApi } from '../api/ticketApi';
import { ShieldAlert, AlertCircle, Send, ArrowLeft, Clock } from 'lucide-react';

const CATEGORIES = [
  'Cloud/Infrastructure',
  'Network & VPN',
  'Database & Storage',
  'Security & Compliance',
  'Software & APIs',
  'Hardware & Peripherals',
  'Access & Permissions',
  'Other'
];

const SLA_TARGETS = {
  Critical: '15 Minutes (Immediate emergency escalation)',
  High: '1 Hour (Production degradation)',
  Medium: '4 Hours (Standard operational issue)',
  Low: '8 Hours (General inquiry or minor issue)'
};

const CreateTicket = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim()) {
      setError('Please provide both a title and a detailed description.');
      return;
    }

    setLoading(true);

    try {
      const res = await ticketApi.createTicket({
        title: title.trim(),
        description: description.trim(),
        category,
        priority
      });

      if (res.success && res.data?.ticket) {
        navigate(`/tickets/${res.data.ticket.id}`);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to create ticket. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h1 className="text-xl font-bold text-slate-900">Raise IT Support Incident</h1>
            <p className="text-xs text-slate-500 mt-1">
              Provide complete incident details to accelerate triage and resolution by our support engineers.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Incident Title *
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Production API Gateway returning 502 Bad Gateway"
                className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Category and Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Priority Level *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Critical">Critical (Immediate Outage)</option>
                  <option value="High">High (Severe Degradation)</option>
                  <option value="Medium">Medium (Moderate Impact)</option>
                  <option value="Low">Low (Minor / Informational)</option>
                </select>
              </div>
            </div>

            {/* SLA Target Banner */}
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex items-center gap-2.5 text-xs text-sky-800">
              <Clock className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <div>
                <span className="font-semibold">Target SLA Resolution Time: </span>
                {SLA_TARGETS[priority]}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Detailed Incident Description *
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the symptoms, impacted services or users, error codes, and steps to reproduce..."
                className="mt-1 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 transition"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Incident
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateTicket;
