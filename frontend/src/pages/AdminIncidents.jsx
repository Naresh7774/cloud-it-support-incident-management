import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { useToast } from '../context/ToastContext';
import { Layers, RefreshCw, AlertOctagon, Shield } from 'lucide-react';

const AdminIncidents = () => {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const initialPriority = searchParams.get('priority') || '';
  const initialOverdue = searchParams.get('isOverdue') === 'true';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOverdueOnly, setIsOverdueOnly] = useState(initialOverdue);

  const fetchIncidents = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await ticketApi.getTickets({
        status: initialStatus || undefined,
        priority: initialPriority || undefined,
        isOverdue: isOverdueOnly ? 'true' : undefined,
        limit: 200,
      });

      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
        if (isManual) {
          toast.success('Incident records refreshed from database.');
        }
      }
    } catch (err) {
      console.error('Failed to load admin incidents:', err);
      toast.error('Failed to retrieve incidents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [initialStatus, initialPriority, isOverdueOnly]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-accent border border-brand-primary/20">
                Incident Ops
              </span>
              <span className="text-xs text-dark-muted font-mono">• Full Organizational Scope</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-brand-accent" />
              Incident Management Ledger
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Search, filter by multi-criteria, monitor SLA countdowns, and manage support tickets.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsOverdueOnly(!isOverdueOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                isOverdueOnly
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30'
                  : 'bg-dark-card text-slate-300 border-dark-border hover:bg-dark-surface'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              {isOverdueOnly ? 'Breached SLA Only' : 'Filter Overdue'}
            </button>

            <button
              onClick={() => fetchIncidents(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-dark-card border border-dark-border rounded-xl text-xs font-semibold text-slate-200 hover:bg-dark-surface shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-accent ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Incidents Table */}
        <TicketTable
          tickets={tickets}
          loading={loading}
          showAssignee={true}
          emptyMessage="No incidents match the active search and filter parameters."
        />
      </div>
    </AppLayout>
  );
};

export default AdminIncidents;
