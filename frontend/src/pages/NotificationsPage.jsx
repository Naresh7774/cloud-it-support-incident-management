import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  ExternalLink,
  Shield,
} from 'lucide-react';

const NotificationsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications({
        onlyUnread: onlyUnread ? 'true' : 'false',
      });
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [onlyUnread]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification cleared.');
    } catch (err) {
      toast.error('Failed to delete notification.');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'SLA_WARNING':
      case 'SLA_BREACH':
        return <AlertOctagon className="w-5 h-5 text-rose-400" />;
      case 'TICKET_ASSIGNED':
        return <CheckCircle2 className="w-5 h-5 text-indigo-400" />;
      case 'TICKET_RESOLVED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'COMMENT_ADDED':
        return <Info className="w-5 h-5 text-brand-accent" />;
      default:
        return <Bell className="w-5 h-5 text-cyan-400" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-accent border border-brand-primary/20">
                Inbox
              </span>
              <span className="text-xs text-dark-muted font-mono">• Operational Telemetry Alerts</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Bell className="w-6 h-6 text-brand-accent" />
              System Alerts & Notifications
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Audit notifications for ticket assignments, SLA threshold warnings, customer updates, and resolutions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-dark-card border border-dark-border rounded-xl text-xs font-semibold text-slate-200 hover:bg-dark-surface shadow-sm transition"
              >
                <CheckCheck className="w-3.5 h-3.5 text-brand-accent" />
                Mark All Read
              </button>
            )}

            <button
              onClick={() => setOnlyUnread(!onlyUnread)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                onlyUnread
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-dark-card text-slate-300 border-dark-border hover:bg-dark-surface'
              }`}
            >
              {onlyUnread ? 'Showing Unread' : 'Filter Unread'}
            </button>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="bg-dark-card rounded-2xl shadow-xl border border-dark-border overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-dark-muted">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-primary/20 border-b-brand-primary"></div>
              <p className="mt-3 text-xs">Querying notification feed...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-dark-muted">
              <Bell className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="font-bold text-white text-base">You're all caught up</p>
              <p className="text-xs text-dark-muted mt-1">No pending notifications at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-border/60">
              {notifications.map((n) => {
                const isUnread = !n.is_read;
                const role = user?.role === 'admin' ? 'admin' : user?.role === 'engineer' ? 'engineer' : 'user';

                return (
                  <div
                    key={n.id}
                    className={`p-5 flex items-start gap-4 transition ${
                      isUnread
                        ? 'bg-brand-primary/5 hover:bg-brand-primary/10'
                        : 'hover:bg-dark-surface/50'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-navy-900 border border-dark-border flex-shrink-0">
                      {getNotificationIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2 truncate">
                          {n.title}
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                          )}
                        </h4>
                        <span className="text-[11px] text-dark-muted font-mono whitespace-nowrap">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>

                      <div className="mt-3 flex items-center gap-3 text-xs">
                        {n.ticket_id && (
                          <Link
                            to={`/${role}/incidents/${n.ticket_id}`}
                            onClick={() => handleMarkAsRead(n.id)}
                            className="inline-flex items-center gap-1 font-bold text-brand-accent hover:text-white transition"
                          >
                            Open Incident #{n.ticket_id}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}

                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="text-slate-400 hover:text-white transition"
                          >
                            Mark Read
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(n.id)}
                          className="text-slate-500 hover:text-rose-400 transition ml-auto p-1 rounded"
                          title="Dismiss notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default NotificationsPage;
