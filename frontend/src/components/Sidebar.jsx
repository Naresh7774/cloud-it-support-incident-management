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
    const interval = setInterval(fetchUnread, 45000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Build role-specific navigation menu
  const getNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Incidents', path: '/admin/incidents', icon: Layers },
        { name: 'User Management', path: '/admin/users', icon: Users },
        { name: 'SLA Configuration', path: '/admin/sla', icon: Sliders },
        { name: 'Analytics & Reports', path: '/admin/analytics', icon: BarChart3 },
        { name: 'Notifications', path: '/admin/notifications', icon: Bell, badge: unreadCount },
        { name: 'System Settings', path: '/admin/settings', icon: Settings },
        { name: 'Admin Profile', path: '/admin/profile', icon: User },
      ];
    } else if (user?.role === 'engineer') {
      return [
        { name: 'Dashboard', path: '/engineer/dashboard', icon: LayoutDashboard },
        { name: 'Assigned to Me', path: '/engineer/assigned', icon: UserCheck },
        { name: 'Unassigned Queue', path: '/engineer/unassigned', icon: Inbox },
        { name: 'My Action History', path: '/engineer/history', icon: History },
        { name: 'Notifications', path: '/engineer/notifications', icon: Bell, badge: unreadCount },
        { name: 'Engineer Profile', path: '/engineer/profile', icon: User },
      ];
    } else {
      // User role
      return [
        { name: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
        { name: 'Raise Incident', path: '/user/create-incident', icon: PlusCircle },
        { name: 'My Incidents', path: '/user/incidents', icon: ListTodo },
        { name: 'Notifications', path: '/user/notifications', icon: Bell, badge: unreadCount },
        { name: 'My Profile', path: '/user/profile', icon: User },
      ];
    }
  };

  const navItems = getNavItems();

  const roleBadgeStyle = {
    admin: 'bg-rose-100 text-rose-800 border-rose-300',
    engineer: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    user: 'bg-slate-100 text-slate-700 border-slate-300',
  }[user?.role || 'user'];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
          <NavLink
            to="/"
            onClick={onClose}
            className="flex items-center gap-2.5 font-bold text-white tracking-tight"
          >
            <div className="bg-sky-600 text-white p-2 rounded-lg shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight">
                Cloud Incident<span className="text-sky-400">Ops</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                ITSM Platform
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Tag Banner */}
        <div className="px-5 py-3 bg-slate-800/40 border-b border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">Portal View:</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${roleBadgeStyle}`}
          >
            {user?.role}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>

                {item.badge > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-red-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Account Footer & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 truncate font-mono">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-900/40 border border-rose-900/30 rounded-xl transition"
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
