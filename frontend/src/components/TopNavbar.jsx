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
  ShieldAlert,
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

  // Poll for notifications
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
      const sectionLabel = section.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      crumbs.push({ label: sectionLabel, path: subId ? `/${rolePrefix}/${section}` : location.pathname });
    }

    if (subId) {
      crumbs.push({ label: subId.startsWith('INC-') ? subId : `Incident #${subId}`, path: location.pathname });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const isDetailPage = Boolean(subId) || section === 'create-incident';

  const notificationsPath = `/${user?.role || 'user'}/notifications`;
  const profilePath = `/${user?.role || 'user'}/profile`;

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile Toggle & Breadcrumbs / Back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {isDetailPage && (
          <button
            onClick={() => navigate(-1)}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}

        {/* Breadcrumb Trail */}
        <nav className="flex items-center space-x-1.5 text-xs">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-bold text-slate-800">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-slate-500 hover:text-sky-600 font-medium transition"
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
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-extrabold text-white animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</span>
              <span className="text-[10px] text-slate-400 font-mono capitalize">{user?.role}</span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-slate-400 font-mono truncate text-[11px]">{user?.email}</p>
                <span className="mt-1.5 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {user?.role}
                </span>
              </div>

              <Link
                to={profilePath}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-sky-600 font-medium transition"
              >
                <User className="w-4 h-4 text-slate-400" />
                Account Profile
              </Link>

              <Link
                to={notificationsPath}
                onClick={() => setProfileOpen(false)}
                className="flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-sky-600 font-medium transition"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-slate-400" />
                  Notifications
                </div>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 font-semibold transition"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
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
