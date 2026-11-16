import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { useToast } from '../context/ToastContext';
import { UserCheck, RefreshCw, Shield } from 'lucide-react';

const EngineerAssigned = () => {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssigned = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await ticketApi.getTickets({
        queue: 'assigned',
        limit: 100,
      });
      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
        if (isManual) toast.success('Assigned queue updated from MySQL.');
      }
    } catch (err) {
      console.error('Failed to load assigned tickets:', err);
      toast.error('Failed to load assigned queue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                Active Queue
              </span>
              <span className="text-xs text-dark-muted font-mono">• Assigned to Logged-in Staff</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <UserCheck className="w-6 h-6 text-indigo-400" />
              Incidents Assigned to Me
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Your active incident queue. Monitor SLA deadlines, update investigation status, and provide resolution notes.
            </p>
          </div>

          <button
            onClick={() => fetchAssigned(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-dark-card border border-dark-border rounded-xl text-xs font-semibold text-slate-200 hover:bg-dark-surface shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-accent ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>

        {/* Tickets Table */}
        <TicketTable
          tickets={tickets}
          loading={loading}
          showAssignee={false}
          emptyMessage="You have no tickets currently assigned to you. Pick up incoming incidents from the Unassigned Pool."
        />
      </div>
    </AppLayout>
  );
};

export default EngineerAssigned;
