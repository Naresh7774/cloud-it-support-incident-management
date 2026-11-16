import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import SlaTimer from '../components/SlaTimer';
import { ticketApi } from '../api/ticketApi';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
        if (res.success && res.data?.users) {
          setEngineers(res.data.users);
        }
      } catch (err) {
        console.error('Failed to load engineers:', err);
      }
    }
  };

  useEffect(() => {
    fetchTicketData();
    fetchEngineers();
  }, [id]);

  // Handle Comment Submission
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await ticketApi.addComment(id, {
        comment: newComment.trim(),
        isInternal: user?.role !== 'user' ? isInternal : false,
      });

      if (res.success && res.data?.comment) {
        setComments((prev) => [...prev, res.data.comment]);
        setNewComment('');
        setIsInternal(false);
        fetchTicketData();
      }
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to add comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Status Change
  const handleStatusChange = async (targetStatus) => {
    if (targetStatus === 'Resolved') {
      setShowResolveModal(true);
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await ticketApi.updateStatus(id, { status: targetStatus });
      if (res.success && res.data?.ticket) {
        setTicket(res.data.ticket);
        fetchTicketData();
      }
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to update ticket status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Resolution Submit
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      alert('Resolution notes are required.');
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
      }
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to resolve ticket.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Engineer Assignment
  const handleAssign = async (targetEngineerId) => {
    try {
      const res = await ticketApi.assignTicket(id, targetEngineerId);
      if (res.success && res.data?.ticket) {
        setTicket(res.data.ticket);
        fetchTicketData();
      }
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to assign engineer.');
    }
  };

  // Handle Priority Change
  const handlePriorityChange = async (newPriority) => {
    try {
      const res = await ticketApi.updatePriority(id, newPriority);
      if (res.success && res.data?.ticket) {
        setTicket(res.data.ticket);
        fetchTicketData();
      }
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to adjust priority.');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !ticket) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">{error || 'Incident record not found'}</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold"
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
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
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{ticket.title}</h1>
              <p className="text-xs text-slate-500 mt-1">
                Category: <strong className="text-slate-700">{ticket.category}</strong> • Created by{' '}
                <strong className="text-slate-700">{ticket.creator_name}</strong> (
                {ticket.creator_email}) on {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>

            {/* Quick Actions for Staff */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Accept & Self-Assign (Engineer) */}
              {user?.role === 'engineer' && ticket.assigned_to !== user?.id && ticket.status !== 'Closed' && (
                <button
                  onClick={() => handleAssign(user.id)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                >
                  Accept & Assign to Me
                </button>
              )}

              {/* Status Actions */}
              {isStaff && ticket.status === 'Open' && (
                <button
                  onClick={() => handleStatusChange('In Progress')}
                  disabled={updatingStatus}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                >
                  Start Progress
                </button>
              )}

              {isStaff && (ticket.status === 'Open' || ticket.status === 'Assigned' || ticket.status === 'In Progress') && (
                <button
                  onClick={() => handleStatusChange('Resolved')}
                  disabled={updatingStatus}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                >
                  Resolve Incident
                </button>
              )}

              {/* Close Ticket (Owner or Staff) */}
              {(isStaff || isOwner) && ticket.status === 'Resolved' && (
                <button
                  onClick={() => handleStatusChange('Closed')}
                  disabled={updatingStatus}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm transition"
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Incident Description & Impact
              </h2>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
                {ticket.description}
              </div>

              {/* Resolution Notes Banner (if present) */}
              {ticket.resolution_notes && (
                <div className="mt-5 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-800 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Resolution Summary
                  </div>
                  <p className="text-sm">{ticket.resolution_notes}</p>
                  {ticket.resolved_at && (
                    <span className="block mt-2 text-xs text-emerald-700">
                      Resolved on: {new Date(ticket.resolved_at).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Comments Thread */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-sky-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Discussion & Collaboration ({comments.length})
                  </h2>
                </div>
              </div>

              {/* Comment List */}
              <div className="space-y-4 mb-6">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    No comments recorded yet. Add notes or questions below.
                  </p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border text-sm transition ${
                        c.is_internal
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {c.author_name}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                            {c.author_role}
                          </span>
                          {c.is_internal && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                              <Lock className="w-3 h-3" />
                              Internal Note
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{c.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="pt-4 border-t border-slate-100 space-y-3">
                <textarea
                  rows={3}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type an update, triage question, or resolution step..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {isStaff ? (
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span>Internal staff note (hidden from customer)</span>
                    </label>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 transition"
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
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Incident Operations
                </h3>

                {/* Status Picker */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Update Incident Status
                  </label>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-sky-500"
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
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Adjust Priority (Recalculates SLA)
                  </label>
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Critical">Critical (15m SLA)</option>
                    <option value="High">High (1h SLA)</option>
                    <option value="Medium">Medium (4h SLA)</option>
                    <option value="Low">Low (8h SLA)</option>
                  </select>
                </div>

                {/* Engineer Assignment */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Assign Support Engineer
                  </label>
                  <select
                    value={ticket.assigned_to || ''}
                    onChange={(e) => handleAssign(e.target.value ? Number(e.target.value) : null)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-sky-500"
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

            {/* Metadata Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Service Level & Ownership
              </h3>

              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-500">Assigned Engineer:</span>
                <span className="font-semibold text-slate-800">
                  {ticket.assignee_name || 'Unassigned'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-500">Target SLA Deadline:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(ticket.sla_deadline).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-500">Created Timestamp:</span>
                <span className="text-slate-700">
                  {new Date(ticket.created_at).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500">Last Updated:</span>
                <span className="text-slate-700">
                  {new Date(ticket.updated_at).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Incident Audit Log ({history.length})
                </h3>
              </div>

              <div className="flow-root max-h-80 overflow-y-auto pr-2">
                <ul className="-mb-8">
                  {history.map((event, idx) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {idx !== history.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center ring-4 ring-white text-[10px] font-bold">
                              {event.action.slice(0, 2)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs text-slate-700 font-medium">
                                <strong className="text-slate-900">{event.actor_name}</strong>{' '}
                                performed <span className="font-bold text-sky-700">{event.action}</span>
                              </p>
                              {event.old_value && event.new_value && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {event.old_value} &rarr; {event.new_value}
                                </p>
                              )}
                              {event.notes && (
                                <p className="text-[11px] text-slate-600 mt-0.5 italic">
                                  "{event.notes}"
                                </p>
                              )}
                            </div>
                            <div className="text-right text-[10px] whitespace-nowrap text-slate-400 font-mono">
                              {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Resolution Notes */}
        {showResolveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Resolve Incident</h3>
              <p className="text-xs text-slate-500 mb-4">
                Please document the root cause, fix applied, or resolution instructions for future knowledge base reference.
              </p>

              <form onSubmit={handleResolveSubmit} className="space-y-4">
                <textarea
                  rows={4}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Cleared deadlock in connection pool, scaled IOPS, or deployed DNS fix..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                  >
                    Confirm Resolution
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
