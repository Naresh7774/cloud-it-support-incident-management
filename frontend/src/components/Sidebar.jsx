import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api/notificationApi';
import {
  ShieldAlert,
  LayoutDashboard,
  Layers,
  Users,
  Settings,
  Sliders,
  BarChart3,
  Bell,
  User,
  LogOut,
  UserCheck,
  Inbox,
  History,
  PlusCircle,
  ListTodo,
  X,
  ChevronRight,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationApi.getNotifications({ onlyUnread: 'true' });
        if (res.success && res.data) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (err) {
        // non-blocking
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Build role-specific navigation items
  const getNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { name: 'Executive Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Incident Management', path: '/admin/incidents', icon: Layers },
        { name: 'User Management', path: '/admin/users', icon: Users },
        { name: 'SLA Configuration', path: '/admin/sla', icon: Sliders },
        { name: 'Analytics & Reports', path: '/admin/analytics', icon: BarChart3 },
        { name: 'System Notifications', path: '/admin/notifications', icon: Bell, badge: unreadCount },
        { name: 'Platform Settings', path: '/admin/settings', icon: Settings },
        { name: 'Admin Profile', path: '/admin/profile', icon: User },
      ];
    } else if (user?.role === 'engineer') {
      return [
        { name: 'Engineer Desk', path: '/engineer/dashboard', icon: LayoutDashboard },
        { name: 'Assigned to Me', path: '/engineer/assigned', icon: UserCheck },
        { name: 'Unassigned Pool', path: '/engineer/unassigned', icon: Inbox },
        { name: 'Action History', path: '/engineer/history', icon: History },
        { name: 'Notifications', path: '/engineer/notifications', icon: Bell, badge: unreadCount },
        { name: 'Engineer Profile', path: '/engineer/profile', icon: User },
      ];
    } else {
      return [
        { name: 'Support Portal', path: '/user/dashboard', icon: LayoutDashboard },
        { name: 'Raise Incident', path: '/user/create-incident', icon: PlusCircle },
        { name: 'My Incidents', path: '/user/incidents', icon: ListTodo },
        { name: 'Notifications', path: '/user/notifications', icon: Bell, badge: unreadCount },
        { name: 'My Profile', path: '/user/profile', icon: User },
      ];
    }
  };

  const navItems = getNavItems();

  const rolePill = {
    admin: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    engineer: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    user: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  }[user?.role || 'user'];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-navy-950 text-slate-300 flex flex-col border-r border-dark-border transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-dark-border bg-navy-950/80 backdrop-blur-md">
          <NavLink
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 font-bold text-white tracking-tight group"
          >
            <div className="bg-gradient-to-br from-brand-primary to-blue-700 text-white p-2 rounded-xl shadow-md shadow-brand-primary/20 border border-blue-400/20 group-hover:scale-105 transition">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-white">
                Cloud Incident<span className="text-brand-accent">Ops</span>
              </span>
              <span className="text-[10px] text-dark-muted uppercase tracking-widest font-mono">
                ITSM Platform
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-surface lg:hidden transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Tag Banner */}
        <div className="px-5 py-3 bg-navy-900/60 border-b border-dark-border flex items-center justify-between">
          <span className="text-[11px] font-semibold text-dark-muted tracking-wider uppercase">Portal Role</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${rolePill}`}
          >
            {user?.role}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' &&
                !['/admin/dashboard', '/engineer/dashboard', '/user/dashboard'].includes(item.path) &&
                location.pathname.startsWith(`${item.path}/`));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25 font-bold border border-blue-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-dark-surface/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-accent'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge > 0 ? (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-500 text-white rounded-full animate-pulse shadow-sm">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight
                    className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isActive ? 'opacity-100 text-white/70' : 'text-slate-500'
                    }`}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Account Footer & Logout */}
        <div className="p-4 border-t border-dark-border bg-navy-950/90">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-cyan-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-dark-muted truncate font-mono">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/40 border border-rose-500/20 rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
