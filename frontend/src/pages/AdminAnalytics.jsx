import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { analyticsApi } from '../api/analyticsApi';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Award,
  Layers,
  Calendar,
} from 'lucide-react';

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getAnalytics();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
        </div>
      </AppLayout>
    );
  }

  const overview = data?.overview || {};
  const leaderboard = data?.engineerLeaderboard || [];
  const categories = data?.categoryPerformance || [];
  const trends = data?.dailyTrends || [];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-sky-600" />
            Support Operations & Analytics Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mean Time to Resolution (MTTR), SLA compliance KPIs, and engineer workload distribution.
          </p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Mean Time to Resolve (MTTR)
              </span>
              <Clock className="w-5 h-5 text-sky-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {overview.mttrFormatted || 'N/A'}
            </div>
            <p className="text-xs text-slate-400 mt-1">Average incident lifecycle</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                SLA Compliance Rate
              </span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-emerald-600">
              {overview.slaComplianceRate || 100}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {overview.slaMetCount || 0} met vs {overview.slaBreachedCount || 0} breached
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Resolved Incidents
              </span>
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-indigo-600">
              {overview.totalResolved || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Successfully mitigated</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Total Volume
              </span>
              <Layers className="w-5 h-5 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {overview.totalTickets || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Historical requests</p>
          </div>
        </div>

        {/* Engineer Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Support Engineer Performance Leaderboard
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Engineer</th>
                  <th className="px-6 py-3.5">Assigned Incidents</th>
                  <th className="px-6 py-3.5">Resolved Incidents</th>
                  <th className="px-6 py-3.5">Average Resolution Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                      No engineer resolution history recorded yet.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((eng) => (
                    <tr key={eng.id} className="hover:bg-slate-50/75 transition">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block">{eng.name}</span>
                        <span className="text-xs text-slate-400 font-mono">{eng.email}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {eng.total_assigned}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {eng.total_resolved}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">
                        {eng.avg_formatted || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown & Daily Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Resolution Time */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Resolution Time by Category
            </h3>
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.category} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>{cat.category}</span>
                    <span className="font-mono text-slate-500">
                      {cat.avg_resolution_mins > 60
                        ? `${Math.floor(cat.avg_resolution_mins / 60)}h ${cat.avg_resolution_mins % 60}m`
                        : `${cat.avg_resolution_mins}m`} ({cat.count} tickets)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (cat.count / (overview.totalTickets || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7-Day Activity Trends */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recent Daily Activity Trend
              </h3>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {trends.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  No volume data in last 7 days.
                </p>
              ) : (
                trends.map((t) => (
                  <div key={t.date} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-700">{t.date}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sky-700 font-semibold">
                        Created: <span className="font-bold">{t.created_count}</span>
                      </span>
                      <span className="text-emerald-700 font-semibold">
                        Resolved: <span className="font-bold">{t.resolved_count}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminAnalytics;
