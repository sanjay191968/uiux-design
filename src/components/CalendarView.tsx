import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Tag
} from 'lucide-react';
import { Task } from '../types';
import { sound } from '../utils/audio';

interface CalendarViewProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onOpenCreateModal: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onToggleTask,
  onOpenCreateModal,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate 7 days around selected date
  const days: Date[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  // Tasks due on selected date
  const tasksForSelectedDay = tasks.filter((t) => {
    return t.deadline.startsWith(selectedDateStr);
  });

  const overdueTasks = tasks.filter((t) => {
    return !t.completed && new Date(t.deadline).getTime() < new Date().getTime();
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-4 space-y-4">
      {/* Calendar Header with navigation */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">
              Schedule & Timeline
            </span>
            <h2 className="text-xl font-bold">
              {selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 7);
                setSelectedDate(prev);
                sound.playPop();
              }}
              className="p-2 rounded-full hover:bg-white/20 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setSelectedDate(new Date());
                sound.playPop();
              }}
              className="px-2.5 py-1 rounded-lg bg-white/20 text-xs font-bold hover:bg-white/30 cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 7);
                setSelectedDate(next);
                sound.playPop();
              }}
              className="p-2 rounded-full hover:bg-white/20 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 7-Day Strip */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-2 border-t border-white/20">
          {days.map((d, idx) => {
            const dStr = d.toISOString().split('T')[0];
            const isToday = dStr === new Date().toISOString().split('T')[0];
            const isSelected = dStr === selectedDateStr;
            const dayTaskCount = tasks.filter((t) => t.deadline.startsWith(dStr) && !t.completed).length;

            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDate(d);
                  sound.playPop();
                }}
                className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-blue-600 shadow-md font-bold'
                    : 'hover:bg-white/15 text-white/90'
                }`}
              >
                <span className="text-[10px] font-medium opacity-80 uppercase">
                  {dayNames[d.getDay()]}
                </span>
                <span className="text-sm sm:text-base font-bold my-0.5">{d.getDate()}</span>
                {dayTaskCount > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-blue-600' : 'bg-amber-300'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda Content */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>
              Agenda for {selectedDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {tasksForSelectedDay.length} {tasksForSelectedDay.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {/* Task Cards for the Day */}
        {tasksForSelectedDay.length > 0 ? (
          <div className="space-y-2.5">
            {tasksForSelectedDay.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                      task.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {task.priority}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4
                      className={`text-sm font-semibold truncate ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              No tasks due on this date
            </p>
            <button
              onClick={onOpenCreateModal}
              className="mt-3 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Schedule a Task
            </button>
          </div>
        )}

        {/* Overdue Alert banner if any */}
        {overdueTasks.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 mt-4">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs mb-2">
              <AlertCircle className="w-4 h-4" />
              <span>{overdueTasks.length} Overdue Tasks Need Attention</span>
            </div>
            <div className="space-y-1.5">
              {overdueTasks.slice(0, 3).map((ot) => (
                <div
                  key={ot.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {ot.title}
                  </span>
                  <button
                    onClick={() => onToggleTask(ot.id)}
                    className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Complete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
