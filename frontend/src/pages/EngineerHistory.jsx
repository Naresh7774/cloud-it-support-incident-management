import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PriorityBadge from '../components/PriorityBadge';
import { userApi } from '../api/userApi';
import { useToast } from '../context/ToastContext';
import { History, RefreshCw, ExternalLink, Activity, AlertCircle } from 'lucide-react';

const EngineerHistory = () => {
  const toast = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await userApi.getEngineerHistory();
      if (res.success && res.data) {
        setHistory(res.data.history || []);
        if (isManual) toast.success('Activity log refreshed.');
      }
    } catch (err) {
      console.error('Failed to load engineer history:', err);
      toast.error('Failed to load audit trail.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const actionBadge = (action) => {
    switch (action) {
      case 'STATUS_CHANGED':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'ASSIGNED':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'COMMENT_ADDED':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'PRIORITY_CHANGED':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'CREATED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-700/30 text-slate-300 border-slate-600/30';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                Audit Trail
              </span>
              <span className="text-xs text-dark-muted font-mono">• Immutable Action History</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <History className="w-6 h-6 text-brand-accent" />
              My Incident Activity Ledger
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Chronological ledger of your ticket self-assignments, triage status transitions, notes, and resolution actions.
            </p>
          </div>

          <button
            onClick={() => fetchHistory(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-dark-card border border-dark-border rounded-xl text-xs font-semibold text-slate-200 hover:bg-dark-surface shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-accent ${refreshing ? 'animate-spin' : ''}`} />
            Refresh History
          </button>
        </div>

        {/* History Table */}
        <div className="bg-dark-card rounded-2xl shadow-xl border border-dark-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-dark-surface/90 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-dark-border">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Ticket ID & Title</th>
                  <th className="px-5 py-3.5">Action Executed</th>
                  <th className="px-5 py-3.5">State Change</th>
                  <th className="px-5 py-3.5">Resolution / Action Notes</th>
                  <th className="px-5 py-3.5 text-right">View Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-dark-muted">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-primary/20 border-b-brand-primary"></div>
                      <p className="mt-3 text-xs">Loading activity ledger...</p>
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-dark-muted">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      <p className="font-semibold text-slate-300">No actions recorded on your account yet.</p>
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id} className="hover:bg-dark-surface/50 transition">
                      <td className="px-5 py-4 font-mono text-xs text-dark-muted whitespace-nowrap">
                        {new Date(h.created_at).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-xs text-brand-accent block">
                          {h.ticket_number}
                        </span>
                        <span className="text-xs text-white max-w-xs truncate block font-medium">
                          {h.ticket_title}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${actionBadge(
                            h.action
                          )}`}
                        >
                          {h.action.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs font-mono">
                        {h.old_value && (
                          <span className="line-through text-slate-500 mr-2">{h.old_value}</span>
                        )}
                        <span className="text-white font-bold">{h.new_value || '-'}</span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-300 max-w-sm truncate">
                        {h.notes || <span className="text-dark-muted italic">No notes</span>}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/engineer/incidents/${h.ticket_id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-accent hover:text-white bg-brand-primary/10 hover:bg-brand-primary/20 px-2.5 py-1.5 rounded-lg border border-brand-primary/30 transition"
                        >
                          View
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EngineerHistory;
