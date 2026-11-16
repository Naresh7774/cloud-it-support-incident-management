import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Search,
  AlertCircle,
  RefreshCw,
  Shield,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  Mail,
  Building,
} from 'lucide-react';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async (isManual = false) => {
    setLoading(true);
    try {
      const res = await userApi.getUsers({
        role: roleFilter || undefined,
        search: searchTerm || undefined,
      });
      if (res.success && res.data) {
        setUsers(res.data.users || []);
        if (isManual) toast.success('User directory refreshed from database.');
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to query user database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleRoleChange = async (userId, targetUserName, newRole) => {
    if (userId === currentUser?.id && newRole !== 'admin') {
      toast.error('You cannot demote your own administrator account.');
      return;
    }

    setUpdatingId(userId);
    try {
      const res = await userApi.updateUserRole(userId, newRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        toast.success(`Role for ${targetUserName} updated to ${newRole.toUpperCase()}.`);
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      (u.department && u.department.toLowerCase().includes(term))
    );
  });

  const roleStyles = {
    admin: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    engineer: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    user: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-accent border border-brand-primary/20">
                Staff & Identity Administration
              </span>
              <span className="text-xs text-dark-muted font-mono">• MySQL Auth Directory</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-brand-accent" />
              User & Role Administration
            </h1>
            <p className="text-xs text-dark-muted mt-1">
              Manage enterprise user permissions, promote support engineers, and enforce RBAC governance.
            </p>
          </div>

          <button
            onClick={() => fetchUsers(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-dark-card border border-dark-border rounded-xl text-xs font-semibold text-slate-200 hover:bg-dark-surface shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-accent" />
            Refresh
          </button>
        </div>

        {/* Directory Card */}
        <div className="bg-dark-card rounded-2xl shadow-xl border border-dark-border overflow-hidden">
          {/* Search & Filter Toolbar */}
          <div className="p-4 sm:p-5 border-b border-dark-border bg-dark-card/90 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search users by name, email, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-navy-900 border border-dark-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs bg-navy-900 border border-dark-border rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-brand-primary transition w-full sm:w-auto"
              >
                <option value="">All Roles</option>
                <option value="admin">Administrators Only</option>
                <option value="engineer">Support Engineers Only</option>
                <option value="user">End Users Only</option>
              </select>

              <span className="text-[11px] text-dark-muted font-mono whitespace-nowrap">
                {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-dark-surface/90 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-dark-border">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Current Role</th>
                  <th className="px-5 py-3.5 text-right">Modify Permission Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-dark-muted">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-primary/20 border-b-brand-primary"></div>
                      <p className="mt-2 text-xs">Loading directory...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-dark-muted">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      <p className="font-semibold text-slate-300">No users match your search query.</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isUpdating = updatingId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-dark-surface/50 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-cyan-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[10px] font-semibold text-brand-accent bg-brand-primary/15 border border-brand-primary/30 px-2 py-0.2 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-dark-muted font-mono">
                                User ID: #{u.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-400">
                          {u.email}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-300">
                          {u.department || <span className="text-slate-600 italic">Not set</span>}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              roleStyles[u.role] || roleStyles.user
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {u.role}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {isUpdating ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-primary/20 border-b-brand-primary mr-2" />
                            ) : null}

                            <select
                              disabled={isSelf || isUpdating}
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, u.name, e.target.value)}
                              className="text-xs bg-navy-900 border border-dark-border text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                            >
                              <option value="user" className="bg-navy-950 text-white">Role: End User</option>
                              <option value="engineer" className="bg-navy-950 text-white">Role: Support Engineer</option>
                              <option value="admin" className="bg-navy-950 text-white">Role: Administrator</option>
                            </select>
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

export default UserManagement;
