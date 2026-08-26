import React, { useState } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  CheckCheck, 
  Trash2, 
  Layers, 
  Calendar, 
  Zap, 
  Filter, 
  Plus,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Task, TaskPriority, SortMode, FilterStatus, TaskCategory } from '../types';
import { TaskCard } from './TaskCard';
import { sortTasks } from '../utils/algorithm';
import { sound } from '../utils/audio';

interface TaskListProps {
  tasks: Task[];
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  selectedPriority: TaskPriority | 'all';
  setSelectedPriority: (priority: TaskPriority | 'all') => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onToggleTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleStar: (task: Task) => void;
  onTogglePin: (task: Task) => void;
  onToggleSubtask: (task: Task, subtaskId: string) => void;
  onExplainScore: (task: Task) => void;
  onBulkComplete: () => void;
  onBulkDelete: () => void;
  onOpenCreateModal: () => void;
}

const CATEGORY_CHIPS: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'All Tags', icon: '✨' },
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'personal', label: 'Personal', icon: '👤' },
  { id: 'study', label: 'Study', icon: '📚' },
  { id: 'health', label: 'Health', icon: '❤️' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'shopping', label: 'Shopping', icon: '🛒' },
];

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  filterStatus,
  setFilterStatus,
  selectedPriority,
  setSelectedPriority,
  selectedCategory,
  setSelectedCategory,
  sortMode,
  setSortMode,
  searchQuery,
  setSearchQuery,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onToggleStar,
  onTogglePin,
  onToggleSubtask,
  onExplainScore,
  onBulkComplete,
  onBulkDelete,
  onOpenCreateModal,
}) => {
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  // Client-side filtering and sorting
  const now = new Date();

  const filteredTasks = tasks.filter((t) => {
    // Status filter
    if (filterStatus === 'active' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    if (filterStatus === 'overdue' && (t.completed || new Date(t.deadline).getTime() >= now.getTime())) return false;
    if (filterStatus === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      if (!t.deadline.startsWith(todayStr)) return false;
    }
    if (filterStatus === 'upcoming' && (t.completed || new Date(t.deadline).getTime() < now.getTime())) return false;

    // Priority filter
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;

    // Category filter
    if (selectedCategory !== 'all' && t.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }

    return true;
  });

  const sortedTasks = sortTasks(filteredTasks, sortMode, now);

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const overdueCount = tasks.filter((t) => !t.completed && new Date(t.deadline).getTime() < now.getTime()).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Search and Filter Controls Header */}
      <div className="p-3 sm:p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 space-y-2.5">
        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              id="task-search-input"
              type="text"
              placeholder="Search tasks, descriptions, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector Dropdown */}
          <div className="relative">
            <select
              id="sort-mode-select"
              value={sortMode}
              onChange={(e) => {
                setSortMode(e.target.value as SortMode);
                sound.playPop();
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-slate-700 cursor-pointer appearance-none pr-7"
            >
              <option value="smart_mix">⚡ Smart Mix (Algorithm)</option>
              <option value="deadline_asc">🕒 Due Date (Earliest)</option>
              <option value="deadline_desc">⏳ Due Date (Latest)</option>
              <option value="priority_desc">🔥 Priority (Highest)</option>
              <option value="created_desc">🆕 Created (Newest)</option>
              <option value="title_asc">🔤 Title (A-Z)</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { id: 'all', label: 'All Tasks', count: tasks.length },
            { id: 'active', label: 'Active', count: activeCount },
            { id: 'today', label: 'Due Today' },
            { id: 'overdue', label: 'Overdue', count: overdueCount, highlight: overdueCount > 0 },
            { id: 'completed', label: 'Done', count: completedCount },
          ].map((tab) => {
            const isSelected = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                id={`filter-tab-${tab.id}`}
                onClick={() => {
                  setFilterStatus(tab.id as FilterStatus);
                  sound.playPop();
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : tab.highlight
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : tab.highlight
                        ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Category Horizontal Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {CATEGORY_CHIPS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  sound.playPop();
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Task List Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {/* Bulk Action Bar if tasks exist */}
        {tasks.length > 0 && (
          <div className="flex items-center justify-between px-1 py-1 text-xs text-slate-500">
            <span className="font-medium">
              Showing {sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}
            </span>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button
                  id="bulk-complete-btn"
                  onClick={onBulkComplete}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark All Done
                </button>
              )}
              {completedCount > 0 && (
                <button
                  id="bulk-delete-btn"
                  onClick={onBulkDelete}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Done
                </button>
              )}
            </div>
          </div>
        )}

        {/* Task Cards */}
        {sortedTasks.length > 0 ? (
          sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onToggleStar={onToggleStar}
              onTogglePin={onTogglePin}
              onToggleSubtask={onToggleSubtask}
              onExplainScore={onExplainScore}
            />
          ))
        ) : (
          /* Empty State */
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 flex items-center justify-center mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No tasks found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
              {searchQuery
                ? `No tasks matching "${searchQuery}". Try changing your search or filters.`
                : filterStatus !== 'all'
                ? `You have no ${filterStatus} tasks right now.`
                : 'Your task list is empty. Tap the button below to add your first task!'}
            </p>
            <button
              onClick={onOpenCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
