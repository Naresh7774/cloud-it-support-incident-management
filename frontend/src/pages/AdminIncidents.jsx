import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import TicketTable from '../components/TicketTable';
import { ticketApi } from '../api/ticketApi';
import { Layers, RefreshCw, AlertOctagon } from 'lucide-react';

const AdminIncidents = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const initialPriority = searchParams.get('priority') || '';
  const initialOverdue = searchParams.get('isOverdue') === 'true';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOverdueOnly, setIsOverdueOnly] = useState(initialOverdue);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await ticketApi.getTickets({
        status: initialStatus || undefined,
        priority: initialPriority || undefined,
        isOverdue: isOverdueOnly ? 'true' : undefined,
        limit: 100,
      });

      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load admin incidents:', err);
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-sky-600" />
              All System Incidents
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Search, filter, monitor SLAs, and manage all organization support requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOverdueOnly(!isOverdueOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                isOverdueOnly
                  ? 'bg-red-100 text-red-700 border-red-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
              {isOverdueOnly ? 'Showing Overdue Only' : 'Filter Overdue'}
            </button>

            <button
              onClick={fetchIncidents}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Incidents Table */}
        <TicketTable
          tickets={tickets}
          loading={loading}
          showAssignee={true}
          emptyMessage="No incidents match the selected search and filter criteria."
        />
      </div>
    </AppLayout>
  );
};

export default AdminIncidents;
