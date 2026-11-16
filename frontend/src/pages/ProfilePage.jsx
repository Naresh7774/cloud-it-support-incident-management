import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Building,
  Phone,
  KeyRound,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  CheckCircle,
} from 'lucide-react';

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await userApi.getProfile();
      if (res.success && res.data?.user) {
        const u = res.data.user;
        setProfile(u);
        setName(u.name || '');
        setDepartment(u.department || '');
        setPhone(u.phone || '');
        setBio(u.bio || '');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await userApi.updateProfile({
        name,
        department,
        phone,
        bio,
      });

      if (res.success) {
        setMessage('Profile updated successfully.');
        fetchProfile();
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      const res = await userApi.updateProfile({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setMessage('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to change password.');
    } finally {
      setSaving(false);
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

  const stats = profile?.stats || {};

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-sky-600" />
            Account & Security Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal profile, department details, contact preferences, and security credentials.
          </p>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* User Identity & Stats Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-xl uppercase shadow-sm">
              {profile?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{profile?.name}</h2>
              <p className="text-xs text-slate-500 font-mono">{profile?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  Role: {profile?.role}
                </span>
                <span className="text-xs text-slate-400">
                  Department: <strong className="text-slate-600">{profile?.department || 'General IT'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Activity Counters */}
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-center">
            {profile?.role === 'user' ? (
              <div>
                <span className="block text-2xl font-bold text-slate-900">{stats.created || 0}</span>
                <span className="text-[11px] text-slate-400 font-medium">Incidents Raised</span>
              </div>
            ) : (
              <>
                <div>
                  <span className="block text-2xl font-bold text-indigo-600">{stats.assigned || 0}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Assigned</span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <span className="block text-2xl font-bold text-emerald-600">{stats.resolved || 0}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Resolved</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Personal Information
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Department / Organization Unit
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Cloud Operations / DevOps"
                  className="mt-1 block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1 block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Account Email (Read-Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="mt-1 block w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Bio / Specialization
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. AWS Certified Solutions Architect, Kubernetes, Linux sysadmin..."
                className="mt-1 block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Update Profile
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Change Security Password
            </h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full sm:w-80 p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="mt-1 block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="mt-1 block w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
