import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import SlaTimer from '../components/SlaTimer';
import { ticketApi } from '../api/ticketApi';
import { useAuth } from '../context/AuthContext';
import { Inbox, RefreshCw, UserPlus, ExternalLink, CheckCircle2 } from 'lucide-react';

const EngineerUnassigned = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchUnassigned = async () => {
    setLoading(true);
    try {
      const res = await ticketApi.getTickets({
        queue: 'unassigned',
        limit: 100,
      });
      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load unassigned queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnassigned();
  }, []);

  const handleSelfAssign = async (ticketId, ticketNumber) => {
    setAssigningId(ticketId);
    setMessage('');
    try {
      const res = await ticketApi.assignTicket(ticketId, user.id);
      if (res.success) {
        setMessage(`Incident ${ticketNumber} assigned to you successfully!`);
        setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      }
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to self-assign ticket.');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Inbox className="w-6 h-6 text-sky-600" />
              Unassigned Support Queue ({tickets.length})
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Available incidents waiting for engineer pickup. Accept an incident to begin triage and resolution.
            </p>
          </div>

          <button
            onClick={fetchUnassigned}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Queue
          </button>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Unassigned Incident Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Ticket ID</th>
                  <th className="px-5 py-3.5">Title & Category</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">SLA Deadline</th>
                  <th className="px-5 py-3.5">Raised By</th>
                  <th className="px-5 py-3.5 text-right">Triage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                      <p className="mt-2 text-xs">Loading unassigned incidents...</p>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">The unassigned queue is empty.</p>
                      <p className="text-xs text-slate-400 mt-1">All incoming incidents are currently assigned to engineers.</p>
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/75 transition">
                      <td className="px-5 py-4 font-mono font-bold text-xs text-sky-700">
                        <Link to={`/engineer/incidents/${t.id}`} className="hover:underline">
                          {t.ticket_number}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/engineer/incidents/${t.id}`}
                          className="font-medium text-slate-900 hover:text-sky-600 block max-w-sm truncate"
                        >
                          {t.title}
                        </Link>
                        <span className="text-xs text-slate-400">{t.category}</span>
                      </td>
                      <td className="px-5 py-4">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-5 py-4">
                        <SlaTimer
                          slaDeadline={t.sla_deadline}
                          status={t.status}
                          isOverdue={t.is_overdue}
                        />
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        <span className="font-medium text-slate-800 block">{t.creator_name}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{t.creator_email}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSelfAssign(t.id, t.ticket_number)}
                            disabled={assigningId === t.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            {assigningId === t.id ? 'Assigning...' : 'Assign to Me'}
                          </button>
                          <Link
                            to={`/engineer/incidents/${t.id}`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Inspect details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
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

export default EngineerUnassigned;
