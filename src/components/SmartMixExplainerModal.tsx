import React from 'react';
import { X, Zap, Clock, ShieldAlert, Award, Calculator } from 'lucide-react';
import { Task } from '../types';
import { explainUrgencyScore } from '../utils/algorithm';

interface SmartMixExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
}

export const SmartMixExplainerModal: React.FC<SmartMixExplainerModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  if (!isOpen || !task) return null;

  const now = new Date();
  const info = explainUrgencyScore(task, now);

  return (
    <div
      id="smart-mix-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="smart-mix-modal-content"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Priority-Deadline Mix Algorithm
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mathematical urgency scoring calculation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Target Task Title */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Analyzing Task</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {task.title}
            </h3>
          </div>

          {/* Formula formula breakdown card */}
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-950 dark:text-blue-200">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Scoring Formula</span>
            </div>
            <code className="text-[11px] block bg-white/70 dark:bg-blue-900/60 p-2 rounded-lg font-mono">
              Score = (Priority Base × Time Multiplier) + Pin/Star Bonuses
            </code>
          </div>

          {/* Detailed step values */}
          <div className="space-y-2">
            {/* 1. Priority base */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Priority: {info.priorityLabel}
                  </span>
                  <p className="text-[10px] text-slate-400">Urgent=100, High=70, Medium=40, Low=15</p>
                </div>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">{info.baseWeight} pts</span>
            </div>

            {/* 2. Time factor */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Deadline Factor</span>
                  <p className="text-[10px] text-slate-400">{info.timeLabel}</p>
                </div>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">×{info.timeMultiplier}</span>
            </div>

            {/* 3. Bonuses */}
            {info.bonuses.length > 0 ? (
              info.bonuses.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{b.label}</span>
                  </div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">+{b.points} pts</span>
                </div>
              ))
            ) : (
              <div className="p-2 text-[11px] text-slate-400 italic text-center">
                No active Pin or Star bonuses applied
              </div>
            )}
          </div>

          {/* Final Calculation Result */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-between shadow-lg shadow-rose-500/20">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                Calculated Smart Mix Score
              </span>
              <h4 className="text-xl font-extrabold">{info.totalScore} Points</h4>
            </div>
            <div className="text-right text-[11px] opacity-90">
              {info.totalScore >= 100 ? '⚡ Priority 1 (Action Now)' : 'Standard Queue'}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Close Explainer
          </button>
        </div>
      </div>
    </div>
  );
};
