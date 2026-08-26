import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  Tag, 
  CheckSquare, 
  Zap, 
  Sparkles,
  Pin,
  Star
} from 'lucide-react';
import { Task, TaskPriority, TaskCategory } from '../types';
import { calculateUrgencyScore } from '../utils/algorithm';
import { sound } from '../utils/audio';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  initialTask?: Task | null;
}

const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'personal', label: 'Personal', icon: '👤' },
  { id: 'study', label: 'Study', icon: '📚' },
  { id: 'health', label: 'Health', icon: '❤️' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'shopping', label: 'Shopping', icon: '🛒' },
];

const PRIORITIES: { id: TaskPriority; label: string; color: string; desc: string }[] = [
  { id: 'urgent', label: 'Urgent', color: 'bg-rose-500 text-white', desc: 'Critical deadline / block' },
  { id: 'high', label: 'High', color: 'bg-amber-500 text-white', desc: 'Important milestone' },
  { id: 'medium', label: 'Medium', color: 'bg-sky-500 text-white', desc: 'Standard task' },
  { id: 'low', label: 'Low', color: 'bg-slate-500 text-white', desc: 'When time permits' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [isPinned, setIsPinned] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      // Format deadline for datetime-local input (YYYY-MM-DDTHH:MM)
      if (initialTask.deadline) {
        const d = new Date(initialTask.deadline);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setDeadline(d.toISOString().slice(0, 16));
      } else {
        setDeadline('');
      }

      if (initialTask.scheduledStart) {
        const s = new Date(initialTask.scheduledStart);
        s.setMinutes(s.getMinutes() - s.getTimezoneOffset());
        setScheduledStart(s.toISOString().slice(0, 16));
      } else {
        setScheduledStart('');
      }

      setPriority(initialTask.priority || 'medium');
      setCategory(initialTask.category || 'personal');
      setTags(initialTask.tags || []);
      setSubtasks(initialTask.subtasks || []);
      setEstimatedMinutes(initialTask.estimatedMinutes || 30);
      setIsPinned(!!initialTask.isPinned);
      setIsStarred(!!initialTask.isStarred);
    } else {
      // Default new task with deadline in 24 hours
      const defaultDate = new Date(Date.now() + 24 * 3600000);
      defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
      setDeadline(defaultDate.toISOString().slice(0, 16));
      setScheduledStart('');
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('personal');
      setTags([]);
      setSubtasks([]);
      setEstimatedMinutes(30);
      setIsPinned(false);
      setIsStarred(false);
    }
    setError('');
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  // Preset deadline buttons
  const applyDeadlinePreset = (hoursOffset: number) => {
    const d = new Date(Date.now() + hoursOffset * 3600000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setDeadline(d.toISOString().slice(0, 16));
    sound.playPop();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
      sound.playPop();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    sound.playPop();
  };

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      setSubtasks([
        ...subtasks,
        { id: `sub_${Date.now()}`, title: subtaskInput.trim(), completed: false },
      ]);
      setSubtaskInput('');
      sound.playPop();
    }
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
    sound.playPop();
  };

  // Calculate live preview urgency score
  const mockTaskForScore: Task = {
    id: initialTask?.id || 'preview',
    userId: 'mock',
    title: title || 'Task',
    description,
    deadline: deadline ? new Date(deadline).toISOString() : new Date().toISOString(),
    priority,
    category,
    tags,
    status: 'pending',
    completed: false,
    subtasks,
    estimatedMinutes,
    isPinned,
    isStarred,
    createdAt: initialTask?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const liveScore = calculateUrgencyScore(mockTaskForScore);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }

    if (!deadline) {
      setError('Please specify a deadline');
      return;
    }

    const payload: Partial<Task> = {
      title: title.trim(),
      description: description.trim(),
      deadline: new Date(deadline).toISOString(),
      scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : undefined,
      priority,
      category,
      tags,
      subtasks,
      estimatedMinutes,
      isPinned,
      isStarred,
    };

    onSave(payload);
    sound.playCreate();
    onClose();
  };

  return (
    <div
      id="task-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
    >
      <div
        id="task-modal-content"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {initialTask ? 'Edit Task' : 'New Task'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {initialTask ? 'Update task details & timeline' : 'Create a structured, trackable task'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Algorithm Urgency Badge */}
            <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Zap className="w-3 h-3 text-amber-500 fill-current" />
              <span>Smart Score: {liveScore}</span>
            </div>

            <button
              id="close-task-modal-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Form Scrollable Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-sm">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              required
              placeholder="e.g., Deliver Mobile Auth Sprint & Submit APK"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description & Notes
            </label>
            <textarea
              id="task-desc-input"
              rows={2}
              placeholder="Add key context, acceptance criteria, or links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            />
          </div>

          {/* Deadline & Date Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Deadline (Due Date & Time) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Timezone local</span>
            </div>

            <div className="relative">
              <input
                id="task-deadline-input"
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
            </div>

            {/* Quick smart deadline chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] font-medium text-slate-400">Quick set:</span>
              <button
                type="button"
                onClick={() => applyDeadlinePreset(2)}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                +2 Hours
              </button>
              <button
                type="button"
                onClick={() => applyDeadlinePreset(6)}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Tonight
              </button>
              <button
                type="button"
                onClick={() => applyDeadlinePreset(24)}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => applyDeadlinePreset(72)}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                +3 Days
              </button>
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Priority Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPriority(p.id);
                      sound.playPop();
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold capitalize text-xs text-slate-900 dark:text-slate-100">
                        {p.label}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          p.id === 'urgent'
                            ? 'bg-rose-500'
                            : p.id === 'high'
                            ? 'bg-amber-500'
                            : p.id === 'medium'
                            ? 'bg-sky-500'
                            : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id);
                    sound.playPop();
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    category === cat.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subtasks Checklist Creator */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subtasks / Action Checklist
            </label>
            <div className="flex gap-2">
              <input
                id="new-subtask-input"
                type="text"
                placeholder="Add subtask step (e.g. Test auth endpoints)"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs"
                  >
                    <span className="text-slate-800 dark:text-slate-200">{st.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags & Flags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Tags adder */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Custom Tags
              </label>
              <div className="flex gap-1.5">
                <input
                  id="tag-input"
                  type="text"
                  placeholder="tag name"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  +
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-rose-500 ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pin & Star Flags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quick Options
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPinned(!isPinned);
                    sound.playPop();
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    isPinned
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5 rotate-45" /> {isPinned ? 'Pinned' : 'Pin to Top'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsStarred(!isStarred);
                    sound.playPop();
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    isStarred
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />{' '}
                  {isStarred ? 'Starred' : 'Star'}
                </button>
              </div>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              id="cancel-task-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-task-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-95"
            >
              {initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
