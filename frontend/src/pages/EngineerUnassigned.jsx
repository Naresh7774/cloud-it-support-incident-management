import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import SlaTimer from '../components/SlaTimer';
import { ticketApi } from '../api/ticketApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Inbox,
  RefreshCw,
  UserPlus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const EngineerUnassigned = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

  const fetchUnassigned = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await ticketApi.getTickets({
        queue: 'unassigned',
        limit: 100,
      });
      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
        if (isManual) toast.success('Unassigned queue updated from database.');
      }
    } catch (err) {
      console.error('Failed to load unassigned queue:', err);
      toast.error('Failed to load unassigned queue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUnassigned();
  }, []);

  const handleSelfAssign = async (ticketId, ticketNumber) => {
    setAssigningId(ticketId);
    try {
      const res = await ticketApi.assignTicket(ticketId, user.id);
      if (res.success) {
        toast.success(`Incident ${ticketNumber} accepted and assigned to you.`);
        setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to self-assign incident.');
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
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-accent border border-brand-primary/20">
                Available Pool
              </span>
              <span className="text-xs text-dark-muted font-mono">• Awaiting Triage Pickup</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Inbox className="w-6 h-6 text-brand-accent" />
              Unassigned Incident Pool ({tickets.length})
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Available incidents waiting for engineer pickup. Accept an incident to self-assign and begin investigation.
            </p>
          </div>

          <button
            onClick={() => fetchUnassigned(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-dark-card border border-dark-border rounded-xl text-xs font-semibold text-slate-200 hover:bg-dark-surface shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-accent ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Pool
          </button>
        </div>

        {/* Unassigned Pool Table */}
        <div className="bg-dark-card rounded-2xl shadow-xl border border-dark-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-dark-surface/90 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-dark-border">
                <tr>
                  <th className="px-5 py-3.5">Ticket ID</th>
                  <th className="px-5 py-3.5">Title & Category</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">SLA Countdown</th>
                  <th className="px-5 py-3.5">Reported By</th>
                  <th className="px-5 py-3.5 text-right">Triage Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-dark-muted">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-primary/20 border-b-brand-primary"></div>
                      <p className="mt-3 text-xs">Querying available incidents...</p>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-dark-muted">
                      <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-80" />
                      <p className="font-bold text-white text-base">Unassigned Queue is Empty</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        All reported support tickets have been claimed and are currently being handled by engineering.
                      </p>
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => {
                    const isAssigning = assigningId === t.id;
                    const role = user?.role === 'admin' ? 'admin' : 'engineer';
                    const detailLink = `/${role}/incidents/${t.id}`;

                    return (
                      <tr key={t.id} className="hover:bg-dark-surface/50 transition">
                        <td className="px-5 py-4 font-mono font-bold text-xs text-brand-accent">
                          <Link to={detailLink} className="hover:underline">
                            {t.ticket_number}
                          </Link>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-white max-w-xs md:max-w-md truncate">
                            <Link to={detailLink} className="hover:text-brand-accent transition">
                              {t.title}
                            </Link>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 font-normal">
                            {t.category}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <PriorityBadge priority={t.priority} />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={t.status} />
                        </td>

                        <td className="px-5 py-4">
                          <SlaTimer
                            slaDeadline={t.sla_deadline}
                            status={t.status}
                            isOverdue={t.is_overdue}
                          />
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-400">
                          <p className="font-medium text-slate-200">{t.creator_name || 'End User'}</p>
                          <span className="text-[11px] font-mono text-dark-muted">{t.creator_email}</span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleSelfAssign(t.id, t.ticket_number)}
                              disabled={isAssigning}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-bold shadow-md shadow-brand-primary/20 transition disabled:opacity-50"
                            >
                              {isAssigning ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-b-white" />
                              ) : (
                                <UserPlus className="w-3.5 h-3.5" />
                              )}
                              Accept & Assign
                            </button>

                            <Link
                              to={detailLink}
                              className="p-1.5 text-slate-400 hover:text-white bg-dark-surface hover:bg-dark-hover border border-dark-border rounded-xl transition"
                              title="Inspect incident details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
