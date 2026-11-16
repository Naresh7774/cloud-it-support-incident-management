import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  PlusCircle,
  LayoutDashboard,
  Users,
  LogOut,
  LifeBuoy,
  ListTodo,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const roleBadgeStyle = {
    admin: 'bg-rose-100 text-rose-800 border-rose-300',
    engineer: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    user: 'bg-slate-100 text-slate-700 border-slate-300',
  }[user?.role || 'user'];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="bg-sky-600 text-white p-2 rounded-lg shadow-sm">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                Cloud Incident<span className="text-sky-600">Ops</span>
              </span>
            </Link>

            {/* Navigation links based on role */}
            <nav className="hidden md:flex items-center gap-1">
              {user?.role === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/admin')
                        ? 'bg-slate-100 text-sky-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Overview
                  </Link>
                  <Link
                    to="/users"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/users')
                        ? 'bg-slate-100 text-sky-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    User Management
                  </Link>
                </>
              )}

              {user?.role === 'engineer' && (
                <>
                  <Link
                    to="/engineer"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/engineer')
                        ? 'bg-slate-100 text-sky-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Engineer Queue
                  </Link>
                </>
              )}

              {user?.role === 'user' && (
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/dashboard')
                      ? 'bg-slate-100 text-sky-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  My Tickets
                </Link>
              )}

              <Link
                to="/create-ticket"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/create-ticket')
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-sky-600" />
                Raise Incident
              </Link>
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
              <span className="text-xs text-slate-500">{user?.email}</span>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${roleBadgeStyle}`}
            >
              {user?.role}
            </span>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
