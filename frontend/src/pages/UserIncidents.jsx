import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { useToast } from '../context/ToastContext';
import { ListTodo, PlusCircle, RefreshCw } from 'lucide-react';

const UserIncidents = () => {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncidents = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await ticketApi.getTickets({
        status: initialStatus || undefined,
        limit: 100,
      });

      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
        if (isManual) toast.success('Your incidents refreshed from database.');
      }
    } catch (err) {
      console.error('Failed to load user incidents:', err);
      toast.error('Failed to load your incidents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [initialStatus]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-accent border border-brand-primary/20">
                User Tickets
              </span>
              <span className="text-xs text-dark-muted font-mono">• Incident Ledger</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <ListTodo className="w-6 h-6 text-brand-accent" />
              My Submitted Incidents
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Track real-time progress, engineer investigations, SLA countdowns, and resolution notes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/user/create-incident"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-bold shadow-md shadow-brand-primary/20 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Raise Incident
            </Link>

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

        {/* Tickets Table */}
        <TicketTable
          tickets={tickets}
          loading={loading}
          showAssignee={true}
          emptyMessage="You have no tickets currently matching this query. Click 'Raise Incident' to submit one."
        />
      </div>
    </AppLayout>
  );
};

export default UserIncidents;
