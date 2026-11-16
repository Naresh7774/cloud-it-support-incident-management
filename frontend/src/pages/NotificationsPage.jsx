import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { notificationApi } from '../api/notificationApi';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const NotificationsPage = () => {
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
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'alert':
        return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      default:
        return <Info className="w-5 h-5 text-sky-600" />;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Bell className="w-6 h-6 text-sky-600" />
              Notifications & Incident Alerts
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time notices on ticket assignments, customer updates, and SLA escalations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setOnlyUnread(!onlyUnread)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                onlyUnread
                  ? 'bg-sky-50 text-sky-700 border-sky-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {onlyUnread ? 'Showing Unread' : 'Filter Unread'}
            </button>

            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark All as Read
            </button>
          </div>
        </div>

        {/* Notification Feed */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
              <p className="mt-2 text-xs">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No notifications found.</p>
              <p className="text-xs text-slate-400 mt-1">You are completely up to date!</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={`p-5 flex items-start justify-between gap-4 transition cursor-pointer ${
                  !n.is_read ? 'bg-sky-50/40 hover:bg-sky-50/70' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-100">
                    {getIcon(n.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                    <span className="block mt-2 text-[10px] text-slate-400 font-mono">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {n.link && (
                    <Link
                      to={n.link}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition"
                      title="Open linked incident"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                  <button
                    onClick={(e) => handleDelete(n.id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                    title="Delete notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default NotificationsPage;
