import React from 'react';
import { 
  BarChart3, 
  Flame, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Award,
  Zap,
  Target
} from 'lucide-react';
import { StatsSummary, User } from '../types';

interface AnalyticsViewProps {
  stats: StatsSummary | null;
  user: User | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats, user }) => {
  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-xs text-slate-500">
        Loading analytics from Node.js backend...
      </div>
    );
  }

  const productivityScore = user?.productivityScore || stats.productivityScore || 75;
  const streakDays = user?.streakDays || stats.streakDays || 1;

  const totalPriorityCount =
    (stats.priorityBreakdown.urgent || 0) +
    (stats.priorityBreakdown.high || 0) +
    (stats.priorityBreakdown.medium || 0) +
    (stats.priorityBreakdown.low || 0);

  const getPriorityPct = (count: number) =>
    totalPriorityCount > 0 ? Math.round((count / totalPriorityCount) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-3 sm:p-4 space-y-4 text-xs">
      {/* Productivity Score Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-600 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              Productivity Health Index
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold">{productivityScore}</h2>
              <span className="text-sm font-semibold text-blue-200">/ 100 pts</span>
            </div>
            <p className="text-xs text-blue-100 mt-1 max-w-xs">
              {productivityScore >= 80
                ? '🔥 Outstanding pace! Consistent task completions boost your ranking.'
                : productivityScore >= 60
                ? '⚡ Good progress. Clear remaining due tasks to hit 85+ pts.'
                : '🌱 Let’s build momentum by checking off high priority tasks.'}
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex flex-col items-center justify-center text-center p-2 border border-white/20">
            <Flame className="w-6 h-6 text-amber-300 animate-pulse" />
            <span className="text-xs font-extrabold mt-0.5">{streakDays}d</span>
            <span className="text-[9px] uppercase tracking-wider text-blue-100">Streak</span>
          </div>
        </div>
      </div>

      {/* 4 Core Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-[11px]">Total Tasks</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-[11px]">Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-[11px]">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.pending + stats.inProgress}</div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-[11px]">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{stats.overdue}</div>
        </div>
      </div>

      {/* Completion Rate Progress Ring/Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-slate-200">Overall Completion Rate</span>
          <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">{stats.completionRate}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, stats.completionRate)}%` }}
          />
        </div>
      </div>

      {/* 7-Day Completion Trend Bar Chart */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>7-Day Activity Velocity</span>
          </span>
          <span className="text-[10px] text-slate-400">Completed per day</span>
        </div>

        <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-1">
          {stats.completionTrend && stats.completionTrend.map((item, idx) => {
            const maxVal = Math.max(1, ...stats.completionTrend.map((t) => t.count));
            const barHeightPct = Math.min(100, Math.max(15, (item.count / maxVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {item.count}
                </span>
                <div
                  className="w-full max-w-[28px] rounded-t-lg bg-blue-500 hover:bg-blue-600 transition-all cursor-pointer"
                  style={{ height: `${barHeightPct}%` }}
                />
                <span className="text-[10px] text-slate-400 font-medium">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="font-bold text-slate-800 dark:text-slate-200">Priority Breakdown</h4>
        <div className="space-y-2">
          {[
            { label: 'Urgent', count: stats.priorityBreakdown.urgent, color: 'bg-rose-500' },
            { label: 'High', count: stats.priorityBreakdown.high, color: 'bg-amber-500' },
            { label: 'Medium', count: stats.priorityBreakdown.medium, color: 'bg-sky-500' },
            { label: 'Low', count: stats.priorityBreakdown.low, color: 'bg-slate-400' },
          ].map((p) => (
            <div key={p.label} className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <span>{p.label}</span>
                <span>{p.count} tasks ({getPriorityPct(p.count)}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${p.color} rounded-full transition-all`}
                  style={{ width: `${getPriorityPct(p.count)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
