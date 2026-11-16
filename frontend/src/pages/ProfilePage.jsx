import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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
  Shield,
  Eye,
  EyeOff,
  Activity,
  Layers,
} from 'lucide-react';

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const toast = useToast();
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
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const res = await userApi.updateProfile({
        name: name.trim(),
        department: department.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
      });

      if (res.success) {
        toast.success('Profile information saved successfully.');
        fetchProfile();
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error('Current password and new password are both required.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password confirmation does not match.');
      return;
    }

    setSavingPassword(true);

    try {
      const res = await userApi.updateProfile({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        toast.success('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Password update failed. Verify current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const roleStyles = {
    admin: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    engineer: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    user: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  }[profile?.role || 'user'];

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-accent border border-brand-primary/20">
              Account Security & Profile
            </span>
            <span className="text-xs text-dark-muted font-mono">• Verified Identity</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-brand-accent" />
            Account Profile & Credentials
          </h1>
          <p className="text-xs text-dark-muted mt-1">
            Manage your personal profile details, contact preferences, and cryptographic authentication password.
          </p>
        </div>

        {/* User Identity Hero Card */}
        <div className="bg-dark-card rounded-2xl p-6 border border-dark-border shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-primary to-cyan-500 text-white flex items-center justify-center font-black text-2xl uppercase shadow-xl flex-shrink-0">
            {profile?.name?.charAt(0) || 'U'}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{profile?.name || 'User'}</h2>
                <p className="text-xs text-dark-muted font-mono">{profile?.email}</p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border self-center sm:self-auto ${roleStyles}`}
              >
                Role: {profile?.role}
              </span>
            </div>

            {/* Quick Metrics */}
            {profile?.stats && (
              <div className="grid grid-cols-3 gap-3 pt-3 mt-3 border-t border-dark-border">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] font-bold uppercase text-dark-muted block">Created</span>
                  <span className="text-lg font-black text-white font-mono">
                    {profile.stats.created ?? 0}
                  </span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-[10px] font-bold uppercase text-dark-muted block">Assigned</span>
                  <span className="text-lg font-black text-brand-accent font-mono">
                    {profile.stats.assigned ?? 0}
                  </span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-[10px] font-bold uppercase text-dark-muted block">Resolved</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {profile.stats.resolved ?? 0}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Information Form */}
        <div className="bg-dark-card rounded-2xl p-6 border border-dark-border shadow-xl space-y-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-dark-border">
            <User className="w-4 h-4 text-brand-accent" />
            Personal & Departmental Information
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address (Immutable)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full px-3.5 py-2.5 bg-navy-950/60 border border-dark-border rounded-xl text-sm text-slate-400 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Department / Business Unit
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., Cloud Infrastructure, DevOps, SRE"
                  className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +1 (555) 019-2834"
                  className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Professional Bio / Role Responsibilities
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of duties, on-call schedules, or operational domain..."
                className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-primary/20 transition disabled:opacity-50"
              >
                {savingProfile ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-b-white" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Profile Information
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-dark-card rounded-2xl p-6 border border-dark-border shadow-xl space-y-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-dark-border">
            <KeyRound className="w-4 h-4 text-brand-accent" />
            Security & Cryptographic Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-5" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 bg-navy-900 border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-dark-surface hover:bg-dark-hover text-white border border-dark-border rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {savingPassword ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-b-white" />
                ) : (
                  <KeyRound className="w-4 h-4 text-brand-accent" />
                )}
                Update Account Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
