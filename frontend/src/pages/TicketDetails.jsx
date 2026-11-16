import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import SlaTimer from '../components/SlaTimer';
import { ticketApi } from '../api/ticketApi';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Clock,
  User,
  Shield,
  MessageSquare,
  History,
  CheckCircle,
  AlertCircle,
  Send,
  Lock,
  UserCheck,
  Tag,
  Calendar,
  X,
  FileText,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment input state
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Status and resolution state
  const [statusAction, setStatusAction] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      const res = await ticketApi.getTicketById(id);
      if (res.success && res.data) {
        setTicket(res.data.ticket);
        setComments(res.data.comments || []);
        setHistory(res.data.history || []);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEngineers = async () => {
    if (user?.role === 'admin' || user?.role === 'engineer') {
      try {
        const res = await userApi.getUsers({ role: 'engineer' });
        if (res.success && res.data) {
          setEngineers(res.data.users || []);
        }
      } catch (err) {
        // non-blocking
      }
    }
  };

  useEffect(() => {
    fetchTicketData();
    fetchEngineers();
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await ticketApi.addComment(id, {
        comment: newComment.trim(),
        isInternal: isInternal && (user.role === 'admin' || user.role === 'engineer'),
      });

      if (res.success && res.data?.comment) {
        setComments((prev) => [...prev, res.data.comment]);
        setNewComment('');
        setIsInternal(false);
        toast.success(isInternal ? 'Internal staff note added.' : 'Public comment posted.');
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'Resolved') {
      setStatusAction('Resolved');
      setShowResolveModal(true);
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await ticketApi.updateStatus(id, {
        status: newStatus,
        resolutionNotes: null,
      });

      if (res.success && res.data?.ticket) {
        setTicket(res.data.ticket);
        fetchTicketData();
        toast.success(`Status updated to ${newStatus}.`);
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update ticket status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.error('Resolution notes are mandatory when marking an incident Resolved.');
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await ticketApi.updateStatus(id, {
        status: 'Resolved',
        resolutionNotes: resolutionNotes.trim(),
      });

      if (res.success && res.data?.ticket) {
        setTicket(res.data.ticket);
        setShowResolveModal(false);
        setResolutionNotes('');
        fetchTicketData();
        toast.success('Incident resolved with verified resolution notes.');
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to resolve ticket.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssign = async (engineerId) => {
    try {
      const res = await ticketApi.assignTicket(id, engineerId);
      if (res.success) {
        fetchTicketData();
        toast.success('Incident reassigned successfully.');
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to reassign incident.');
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const res = await ticketApi.updatePriority(id, newPriority);
      if (res.success) {
        fetchTicketData();
        toast.success(`Priority updated to ${newPriority}. SLA deadline recalculated.`);
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to adjust priority.');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-[60vh] text-dark-muted">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-brand-primary/20 border-b-brand-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !ticket) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center bg-dark-card border border-dark-border rounded-2xl shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">{error || 'Incident record not found'}</h2>
          <p className="text-xs text-dark-muted mt-1">This ticket may have been removed or you do not possess access rights.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-5 px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            Return Back
          </button>
        </div>
      </AppLayout>
    );
  }

  const isStaff = user?.role === 'admin' || user?.role === 'engineer';
  const isOwner = ticket.created_by === user?.id;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Hero Card */}
        <div className="bg-dark-card rounded-2xl shadow-xl border border-dark-border p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="font-mono text-xs font-bold text-brand-accent bg-brand-primary/10 px-2.5 py-1 rounded-lg border border-brand-primary/30">
                  {ticket.ticket_number}
                </span>
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
                <SlaTimer
                  slaDeadline={ticket.sla_deadline}
                  status={ticket.status}
                  isOverdue={ticket.is_overdue}
                />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">{ticket.title}</h1>
              <p className="text-xs text-dark-muted mt-1.5">
                Category: <strong className="text-slate-300 font-mono">{ticket.category}</strong> • Created by{' '}
                <strong className="text-slate-200">{ticket.creator_name}</strong> (
                {ticket.creator_email}) on {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Accept & Self-Assign (Engineer) */}
              {user?.role === 'engineer' && ticket.assigned_to !== user?.id && ticket.status !== 'Closed' && (
                <button
                  onClick={() => handleAssign(user.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
                >
                  Accept & Assign to Me
                </button>
              )}

              {/* Status Actions */}
              {isStaff && ticket.status === 'Open' && (
                <button
                  onClick={() => handleStatusChange('In Progress')}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition"
                >
                  Start Progress
                </button>
              )}

              {isStaff &&
                (ticket.status === 'Open' || ticket.status === 'Assigned' || ticket.status === 'In Progress') && (
                  <button
                    onClick={() => handleStatusChange('Resolved')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
                  >
                    Resolve Incident
                  </button>
                )}

              {/* Close Ticket (Owner or Staff) */}
              {(isStaff || isOwner) && ticket.status === 'Resolved' && (
                <button
                  onClick={() => handleStatusChange('Closed')}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600/50 rounded-xl text-xs font-bold shadow-md transition"
                >
                  Confirm & Close Incident
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Details, Resolution Notes, Comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-dark-card rounded-2xl shadow-xl border border-dark-border p-6">
              <h2 className="text-xs font-bold text-dark-muted uppercase tracking-wider mb-3">
                Incident Description & Scope
              </h2>
              <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed bg-navy-900 p-4 rounded-xl border border-dark-border font-sans">
                {ticket.description}
              </div>

              {/* Resolution Notes Banner (if present) */}
              {ticket.resolution_notes && (
                <div className="mt-5 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-400 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Verified Resolution Summary
                  </div>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{ticket.resolution_notes}</p>
                  {ticket.resolved_at && (
                    <span className="block mt-2 text-xs text-emerald-400 font-mono">
                      Resolved on: {new Date(ticket.resolved_at).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Comments Thread */}
            <div className="bg-dark-card rounded-2xl shadow-xl border border-dark-border p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-accent" />
                  <h2 className="text-base font-bold text-white">
                    Investigation Log & Discussion ({comments.length})
                  </h2>
                </div>
              </div>

              {/* Comment List */}
              <div className="space-y-4 mb-6">
                {comments.length === 0 ? (
                  <p className="text-xs text-dark-muted italic text-center py-6">
                    No comments recorded yet. Add notes or questions below.
                  </p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border text-sm transition ${
                        c.is_internal
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-navy-900 border-dark-border text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{c.author_name}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-dark-surface text-slate-300 border border-dark-border">
                            {c.author_role}
                          </span>
                          {c.is_internal && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <Lock className="w-3 h-3" />
                              Internal Note
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-dark-muted font-mono">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-slate-300 text-xs sm:text-sm leading-relaxed">
                        {c.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="pt-4 border-t border-dark-border space-y-3">
                <textarea
                  rows={3}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type an update, triage question, or investigation step..."
                  className="w-full p-3 bg-navy-900 border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary leading-relaxed"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {isStaff ? (
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded bg-navy-900 border-dark-border text-brand-primary focus:ring-brand-primary"
                      />
                      <span>Internal staff note (Strictly hidden from customer)</span>
                    </label>
                  ) : (
                    <div />
                  )}

                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-bold shadow-md shadow-brand-primary/20 disabled:opacity-50 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Post Comment
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Column: Controls, SLA Details & Audit Trail */}
          <div className="space-y-6">
            {/* Incident Controls Card (Staff) */}
            {isStaff && (
              <div className="bg-dark-card rounded-2xl shadow-xl border border-dark-border p-5 space-y-4">
                <h3 className="text-xs font-bold text-dark-muted uppercase tracking-wider pb-2 border-b border-dark-border">
                  Incident Triage Controls
                </h3>

                {/* Status Picker */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Transition Status
                  </label>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    className="w-full text-xs font-bold bg-navy-900 border border-dark-border rounded-xl p-2.5 text-white focus:border-brand-primary transition cursor-pointer"
                  >
                    <option value="Open">Open</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Priority Picker */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Adjust Priority (Recalculates SLA)
                  </label>
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="w-full text-xs font-bold bg-navy-900 border border-dark-border rounded-xl p-2.5 text-white focus:border-brand-primary transition cursor-pointer"
                  >
                    <option value="Critical">Critical (15m SLA)</option>
                    <option value="High">High (1h SLA)</option>
                    <option value="Medium">Medium (4h SLA)</option>
                    <option value="Low">Low (8h SLA)</option>
                  </select>
                </div>

                {/* Engineer Assignment */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Assignee Engineer
                  </label>
                  <select
                    value={ticket.assigned_to || ''}
                    onChange={(e) => handleAssign(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full text-xs font-bold bg-navy-900 border border-dark-border rounded-xl p-2.5 text-white focus:border-brand-primary transition cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>
                        {eng.name} ({eng.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* SLA Telemetry Card */}
            <div className="bg-dark-card rounded-2xl shadow-xl border border-dark-border p-5 space-y-3">
              <h3 className="text-xs font-bold text-dark-muted uppercase tracking-wider pb-2 border-b border-dark-border">
                SLA Compliance Telemetry
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-dark-border/60">
                  <span className="text-slate-400">Created:</span>
                  <span className="font-mono text-white text-right">
                    {new Date(ticket.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dark-border/60">
                  <span className="text-slate-400">SLA Target Deadline:</span>
                  <span className="font-mono text-brand-accent text-right">
                    {new Date(ticket.sla_deadline).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dark-border/60">
                  <span className="text-slate-400">Current Status:</span>
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Breach Flag:</span>
                  <span
                    className={`font-bold font-mono ${
                      ticket.is_overdue ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {ticket.is_overdue ? 'BREACHED' : 'COMPLIANT'}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="bg-dark-card rounded-2xl shadow-xl border border-dark-border p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-dark-border">
                <History className="w-4 h-4 text-brand-accent" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Audit History ({history.length})
                </h3>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <p className="text-xs text-dark-muted italic">No historical actions logged.</p>
                ) : (
                  history.map((h, idx) => (
                    <div key={h.id || idx} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-brand-primary mt-1.5 flex-shrink-0" />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{h.action.replace('_', ' ')}</span>
                          <span className="text-[10px] text-dark-muted font-mono">
                            {new Date(h.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        {h.old_value && h.new_value && (
                          <p className="text-[11px] text-slate-400 font-mono">
                            {h.old_value} &rarr; <span className="text-brand-accent">{h.new_value}</span>
                          </p>
                        )}
                        {h.notes && (
                          <p className="text-[11px] text-slate-300 leading-tight">{h.notes}</p>
                        )}
                        <span className="text-[10px] text-dark-muted font-mono block">
                          By {h.user_name || 'System User'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resolve Modal Dialog */}
        {showResolveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-dark-card border border-dark-border rounded-2xl shadow-2xl max-w-lg w-full p-6 text-dark-light animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-dark-border">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Resolve Incident</h3>
                </div>
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-surface transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmResolve} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Resolution Notes & Mitigation Summary *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe the root cause, patch applied, rollback performed, or mitigation verified..."
                    className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary leading-relaxed"
                  />
                  <p className="text-[11px] text-dark-muted mt-1">
                    These notes will be displayed on the ticket ledger and shared with the reporting user upon verification.
                  </p>
                </div>

                <div className="pt-3 border-t border-dark-border flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-dark-surface hover:bg-dark-hover transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                  >
                    {updatingStatus ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-b-white" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Confirm & Resolve Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TicketDetails;
