import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { UserCheck, RefreshCw } from 'lucide-react';

const EngineerAssigned = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssigned = async () => {
    setLoading(true);
    try {
      const res = await ticketApi.getTickets({
        queue: 'mine',
        limit: 100,
      });
      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load assigned tickets:', err);
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <UserCheck className="w-6 h-6 text-sky-600" />
              Incidents Assigned to Me
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Your active incident queue. Monitor SLA deadlines, update investigation status, and provide resolution notes.
            </p>
          </div>

          <button
            onClick={fetchAssigned}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Queue
          </button>
        </div>

        {/* Tickets Table */}
        <TicketTable
          tickets={tickets}
          loading={loading}
          showAssignee={false}
          emptyMessage="You have no tickets currently assigned to you. Pick up incoming incidents from the Unassigned Queue."
        />
      </div>
    </AppLayout>
  );
};

export default EngineerAssigned;
