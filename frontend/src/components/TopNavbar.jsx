import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api/notificationApi';
import {
  Menu,
  Bell,
  ArrowLeft,
  User,
  LogOut,
  ChevronRight,
  Shield,
  ExternalLink,
} from 'lucide-react';

const TopNavbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll for unread notifications
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
  }, [location.pathname]);

  // Derive page title & breadcrumbs from pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const rolePrefix = pathParts[0] || 'user';
  const section = pathParts[1] || 'dashboard';
  const subId = pathParts[2];

  const getBreadcrumbs = () => {
    const crumbs = [];
    crumbs.push({ label: rolePrefix.toUpperCase(), path: `/${rolePrefix}/dashboard` });

    if (section && section !== 'dashboard') {
      const sectionLabel = section.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      crumbs.push({
        label: sectionLabel,
        path: subId ? `/${rolePrefix}/${section}` : location.pathname,
      });
    }

    if (subId) {
      crumbs.push({
        label: subId.startsWith('INC-') ? subId : `Incident #${subId}`,
        path: location.pathname,
      });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const isDetailPage = Boolean(subId) || section === 'create-incident';

  const notificationsPath = `/${user?.role || 'user'}/notifications`;
  const profilePath = `/${user?.role || 'user'}/profile`;

  return (
    <header className="h-16 bg-navy-950/80 border-b border-dark-border sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Left: Mobile Toggle & Breadcrumbs / Back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-dark-surface lg:hidden transition"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {isDetailPage && (
          <button
            onClick={() => navigate(-1)}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-dark-border bg-dark-surface/80 hover:bg-dark-hover transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-brand-accent" />
            Back
          </button>
        )}

        {/* Breadcrumb Trail */}
        <nav className="flex items-center space-x-1.5 text-xs">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-bold text-white">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-dark-muted hover:text-brand-accent font-medium transition"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Notifications & Profile Menu */}
      <div className="flex items-center gap-3">
        {/* Notifications Button */}
        <Link
          to={notificationsPath}
          className="relative p-2 text-slate-400 hover:text-white hover:bg-dark-surface rounded-xl transition"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white ring-2 ring-navy-950 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-dark-surface transition border border-transparent hover:border-dark-border"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-cyan-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">{user?.name}</span>
              <span className="text-[10px] text-dark-muted font-mono capitalize">{user?.role}</span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-dark-card rounded-2xl shadow-2xl border border-dark-border py-2 z-50 text-xs backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2.5 border-b border-dark-border">
                <p className="font-bold text-white truncate">{user?.name}</p>
                <p className="text-dark-muted font-mono truncate text-[11px]">{user?.email}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-brand-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    Role: <span className="text-brand-accent">{user?.role}</span>
                  </span>
                </div>
              </div>

              <Link
                to={profilePath}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-dark-surface hover:text-white font-medium transition"
              >
                <User className="w-4 h-4 text-slate-400" />
                Account Profile
              </Link>

              <Link
                to={notificationsPath}
                onClick={() => setProfileOpen(false)}
                className="flex items-center justify-between px-4 py-2 text-slate-300 hover:bg-dark-surface hover:text-white font-medium transition"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-slate-400" />
                  Notifications
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <div className="border-t border-dark-border mt-1 pt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate('/login', { replace: true });
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:bg-rose-950/40 font-semibold transition"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
