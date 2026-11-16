import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { ListTodo, PlusCircle, RefreshCw } from 'lucide-react';

const UserIncidents = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await ticketApi.getTickets({
        status: initialStatus || undefined,
        limit: 100,
      });

      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load user incidents:', err);
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ListTodo className="w-6 h-6 text-sky-600" />
              My Submitted Incidents
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track the progress, engineer investigations, and SLA countdowns on your support tickets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/user/create-incident"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Raise Incident
            </Link>

            <button
              onClick={fetchIncidents}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
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
