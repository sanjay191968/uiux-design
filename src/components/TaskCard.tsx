import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  Calendar, 
  Star, 
  Pin, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Briefcase, 
  User, 
  BookOpen, 
  Heart, 
  DollarSign, 
  ShoppingCart, 
  Tag, 
  Zap, 
  Info
} from 'lucide-react';
import { Task, TaskPriority } from '../types';
import { explainUrgencyScore } from '../utils/algorithm';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleStar: (task: Task) => void;
  onTogglePin: (task: Task) => void;
  onToggleSubtask: (task: Task, subtaskId: string) => void;
  onExplainScore?: (task: Task) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  work: <Briefcase className="w-3.5 h-3.5" />,
  personal: <User className="w-3.5 h-3.5" />,
  study: <BookOpen className="w-3.5 h-3.5" />,
  health: <Heart className="w-3.5 h-3.5" />,
  finance: <DollarSign className="w-3.5 h-3.5" />,
  shopping: <ShoppingCart className="w-3.5 h-3.5" />,
};

const PRIORITY_STYLES: Record<TaskPriority, { bg: string; text: string; border: string; badge: string }> = {
  urgent: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-900/50',
    badge: 'bg-rose-600 text-white',
  },
  high: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-900/50',
    badge: 'bg-amber-500 text-white',
  },
  medium: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    text: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-900/50',
    badge: 'bg-sky-600 text-white',
  },
  low: {
    bg: 'bg-slate-50 dark:bg-slate-800/40',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-500 text-white',
  },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
  onToggleStar,
  onTogglePin,
  onToggleSubtask,
  onExplainScore,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);

  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const now = new Date();
  const deadlineDate = new Date(task.deadline);
  const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isOverdue = !task.completed && diffHours < 0;

  const scoreInfo = explainUrgencyScore(task, now);

  // Format relative deadline string
  const formatDeadline = () => {
    if (task.completed) {
      return task.completedAt
        ? `Completed ${new Date(task.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
        : 'Completed';
    }

    if (isOverdue) {
      const hoursPast = Math.floor(Math.abs(diffHours));
      if (hoursPast < 24) return `Overdue by ${hoursPast}h`;
      const daysPast = Math.floor(hoursPast / 24);
      return `Overdue by ${daysPast}d`;
    }

    if (diffHours <= 2) {
      const minutes = Math.max(1, Math.floor(diffHours * 60));
      return `Due in ${minutes}m`;
    }
    if (diffHours <= 24) {
      return `Due today at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffHours <= 48) {
      return `Tomorrow at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return deadlineDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      sound.playComplete();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      });
    } else {
      sound.playPop();
    }
    onToggle(task.id);
  };

  const completedSubtasksCount = task.subtasks ? task.subtasks.filter((s) => s.completed).length : 0;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;

  return (
    <div
      id={`task-card-${task.id}`}
      className={`group relative rounded-2xl border transition-all duration-200 shadow-sm ${
        task.completed
          ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 opacity-75'
          : isOverdue
          ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-900/60 shadow-rose-100/50 dark:shadow-none'
          : task.isPinned
          ? 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50 shadow-indigo-100/30'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top badges & indicators */}
      <div className="p-4 sm:p-4.5">
        <div className="flex items-start gap-3">
          {/* Custom Animated Checkbox */}
          <button
            id={`task-check-${task.id}`}
            onClick={handleCheckboxClick}
            aria-label={task.completed ? 'Mark pending' : 'Mark completed'}
            className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
              task.completed
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200 dark:shadow-none scale-95'
                : isOverdue
                ? 'border-rose-400 dark:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30'
            }`}
          >
            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header row with Priority, Category, and Urgency Mix Score */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {/* Pinned Tag */}
              {task.isPinned && !task.completed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  <Pin className="w-2.5 h-2.5 fill-current rotate-45" /> Pinned
                </span>
              )}

              {/* Priority Badge */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${priorityStyle.badge}`}
              >
                {task.priority}
              </span>

              {/* Category Pill */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {CATEGORY_ICONS[task.category.toLowerCase()] || <Tag className="w-2.5 h-2.5" />}
                <span className="capitalize">{task.category}</span>
              </span>

              {/* Urgency Mix Score Badge */}
              {!task.completed && (
                <button
                  id={`score-info-btn-${task.id}`}
                  onClick={() => onExplainScore?.(task)}
                  title="Click to view Algorithm Urgency Breakdown"
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-transform active:scale-95 cursor-pointer ${
                    scoreInfo.totalScore > 120
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                      : scoreInfo.totalScore > 70
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>{scoreInfo.totalScore} pts</span>
                  <Info className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                </button>
              )}
            </div>

            {/* Task Title */}
            <h3
              className={`text-base font-semibold leading-snug break-words ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h3>

            {/* Description */}
            {task.description && (
              <p
                className={`mt-1 text-xs sm:text-sm line-clamp-2 leading-relaxed ${
                  task.completed
                    ? 'text-slate-400 dark:text-slate-600'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Tags row */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Deadline & Subtask count footer */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
              {/* Deadline indicator */}
              <div
                className={`inline-flex items-center gap-1.5 font-medium ${
                  task.completed
                    ? 'text-slate-400 dark:text-slate-500'
                    : isOverdue
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : diffHours <= 6
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {isOverdue && !task.completed ? (
                  <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                <span>{formatDeadline()}</span>
              </div>

              {/* Subtask accordion button */}
              {totalSubtasks > 0 && (
                <button
                  id={`subtask-toggle-${task.id}`}
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <span className={completedSubtasksCount === totalSubtasks ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                    {completedSubtasksCount}/{totalSubtasks} steps
                  </span>
                  {showSubtasks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>

          {/* Quick Action Icon Buttons */}
          <div className="flex flex-col items-center gap-1">
            {/* Star toggle */}
            <button
              id={`star-btn-${task.id}`}
              onClick={() => {
                sound.playPop();
                onToggleStar(task);
              }}
              title={task.isStarred ? 'Unstar' : 'Star'}
              aria-label={task.isStarred ? 'Unstar task' : 'Star task'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                task.isStarred
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Star className={`w-4 h-4 ${task.isStarred ? 'fill-current' : ''}`} />
            </button>

            {/* Pin toggle */}
            <button
              id={`pin-btn-${task.id}`}
              onClick={() => {
                sound.playPop();
                onTogglePin(task);
              }}
              title={task.isPinned ? 'Unpin' : 'Pin to top'}
              aria-label={task.isPinned ? 'Unpin task' : 'Pin task'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                task.isPinned
                  ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Pin className={`w-4 h-4 rotate-45 ${task.isPinned ? 'fill-current' : ''}`} />
            </button>

            {/* Edit button */}
            <button
              id={`edit-btn-${task.id}`}
              onClick={() => {
                sound.playPop();
                onEdit(task);
              }}
              title="Edit Task"
              aria-label="Edit task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Delete button */}
            <button
              id={`delete-btn-${task.id}`}
              onClick={() => {
                sound.playDelete();
                onDelete(task.id);
              }}
              title="Delete Task"
              aria-label="Delete task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Subtask Checklist */}
        {showSubtasks && totalSubtasks > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 pl-9">
            {task.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                onClick={() => {
                  sound.playPop();
                  onToggleSubtask(task, subtask.id);
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/50 cursor-pointer text-xs"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    subtask.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {subtask.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span
                  className={
                    subtask.completed
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-700 dark:text-slate-300'
                  }
                >
                  {subtask.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
