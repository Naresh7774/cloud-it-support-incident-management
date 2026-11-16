import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PriorityBadge from '../components/PriorityBadge';
import { userApi } from '../api/userApi';
import { History, RefreshCw, ExternalLink } from 'lucide-react';

const EngineerHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await userApi.getEngineerHistory();
      if (res.success && res.data) {
        setHistory(res.data.history || []);
      }
    } catch (err) {
      console.error('Failed to load engineer history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const actionBadge = (action) => {
    switch (action) {
      case 'STATUS_CHANGED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ASSIGNED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'COMMENT_ADDED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'PRIORITY_CHANGED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CREATED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <History className="w-6 h-6 text-sky-600" />
              My Incident Activity & Audit Trail
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Complete chronological log of all your ticket assignments, status updates, internal notes, and resolutions.
            </p>
          </div>

          <button
            onClick={fetchHistory}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh History
          </button>
        </div>

        {/* History List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
              <p className="mt-2 text-xs">Loading activity history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No activity history recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1">Pick up or update an incident to generate activity logs.</p>
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="p-5 hover:bg-slate-50/75 transition flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {h.ticket_number}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${actionBadge(h.action)}`}>
                      {h.action}
                    </span>
                    <PriorityBadge priority={h.priority} />
                    <span className="text-xs font-semibold text-slate-900">
                      {h.ticket_title}
                    </span>
                  </div>

                  {h.old_value && h.new_value && (
                    <p className="text-xs text-slate-600 font-medium">
                      Changed from <span className="font-bold text-slate-700">{h.old_value}</span> &rarr;{' '}
                      <span className="font-bold text-sky-700">{h.new_value}</span>
                    </p>
                  )}

                  {h.notes && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-w-2xl">
                      "{h.notes}"
                    </p>
                  )}

                  <span className="block text-[11px] text-slate-400 font-mono">
                    Timestamp: {new Date(h.created_at).toLocaleString()}
                  </span>
                </div>

                <Link
                  to={`/engineer/incidents/${h.ticket_id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition"
                >
                  View Incident
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default EngineerHistory;
