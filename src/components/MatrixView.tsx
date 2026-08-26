import React from 'react';
import { 
  Grid2X2, 
  Flame, 
  Calendar, 
  Users, 
  Archive, 
  CheckCircle2, 
  Clock, 
  Plus
} from 'lucide-react';
import { Task } from '../types';
import { sound } from '../utils/audio';

interface MatrixViewProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onOpenCreateModal: () => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  tasks,
  onToggleTask,
  onOpenCreateModal,
}) => {
  const now = new Date();

  // Categorize active tasks
  const activeTasks = tasks.filter((t) => !t.completed);

  const isUrgent = (t: Task) => {
    const diffHours = (new Date(t.deadline).getTime() - now.getTime()) / 3600000;
    return t.priority === 'urgent' || diffHours <= 24;
  };

  const isImportant = (t: Task) => {
    return t.priority === 'urgent' || t.priority === 'high' || t.isPinned || t.isStarred;
  };

  // Q1: Urgent & Important (Do First)
  const q1Tasks = activeTasks.filter((t) => isUrgent(t) && isImportant(t));
  // Q2: Not Urgent & Important (Schedule)
  const q2Tasks = activeTasks.filter((t) => !isUrgent(t) && isImportant(t));
  // Q3: Urgent & Not Important (Delegate / Quick)
  const q3Tasks = activeTasks.filter((t) => isUrgent(t) && !isImportant(t));
  // Q4: Not Urgent & Not Important (Eliminate / Backlog)
  const q4Tasks = activeTasks.filter((t) => !isUrgent(t) && !isImportant(t));

  const renderQuadrant = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    quadrantTasks: Task[],
    headerBg: string,
    badgeColor: string
  ) => (
    <div className="flex-1 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      <div className={`px-3 py-2.5 ${headerBg} flex items-center justify-between border-b border-slate-100 dark:border-slate-800`}>
        <div className="flex items-center gap-1.5 min-w-0">
          {icon}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
              {subtitle}
            </span>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badgeColor}`}>
          {quadrantTasks.length}
        </span>
      </div>

      <div className="p-2.5 flex-1 overflow-y-auto space-y-1.5 min-h-[110px] max-h-[220px]">
        {quadrantTasks.length > 0 ? (
          quadrantTasks.map((t) => (
            <div
              key={t.id}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => {
                    sound.playComplete();
                    onToggleTask(t.id);
                  }}
                  className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:bg-emerald-50 cursor-pointer flex-shrink-0"
                >
                  <CheckCircle2 className="w-3 h-3 text-transparent hover:text-emerald-500" />
                </button>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {t.title}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                {t.priority}
              </span>
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center text-center p-3 text-slate-400 text-[11px] italic">
            No tasks in this quadrant
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-4 space-y-3">
      {/* Matrix Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Grid2X2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Eisenhower Decision Matrix</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Categorized automatically by urgency deadline and priority importance
          </p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* 2x2 Quadrant Grid */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pb-2">
        {/* Q1: Do First */}
        {renderQuadrant(
          '1. Do First',
          'Urgent & Important (Today)',
          <Flame className="w-4 h-4 text-rose-500" />,
          q1Tasks,
          'bg-rose-50 dark:bg-rose-950/40',
          'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
        )}

        {/* Q2: Schedule */}
        {renderQuadrant(
          '2. Schedule',
          'Not Urgent & Important',
          <Calendar className="w-4 h-4 text-blue-500" />,
          q2Tasks,
          'bg-blue-50 dark:bg-blue-950/40',
          'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
        )}

        {/* Q3: Delegate / Quick */}
        {renderQuadrant(
          '3. Delegate / Quick',
          'Urgent & Less Important',
          <Users className="w-4 h-4 text-amber-500" />,
          q3Tasks,
          'bg-amber-50 dark:bg-amber-950/40',
          'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
        )}

        {/* Q4: Eliminate / Backlog */}
        {renderQuadrant(
          '4. Backlog / Review',
          'Neither Urgent nor Critical',
          <Archive className="w-4 h-4 text-slate-500" />,
          q4Tasks,
          'bg-slate-100 dark:bg-slate-800/50',
          'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
        )}
      </div>
    </div>
  );
};
