/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { Task, User, StatsSummary, FilterStatus, TaskPriority, SortMode } from './types';
import { MobileFrame, AppTab } from './components/MobileFrame';
import { AuthScreen } from './components/AuthScreen';
import { TaskList } from './components/TaskList';
import { CalendarView } from './components/CalendarView';
import { MatrixView } from './components/MatrixView';
import { AnalyticsView } from './components/AnalyticsView';
import { ProfileView } from './components/ProfileView';
import { TaskModal } from './components/TaskModal';
import { SmartMixExplainerModal } from './components/SmartMixExplainerModal';
import { ApiInspectorModal } from './components/ApiInspectorModal';
import { sound } from './utils/audio';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(() => api.getSavedUser());
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Tab & UI state
  const [activeTab, setActiveTab] = useState<AppTab>('tasks');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskpulse_theme');
      return saved ? saved === 'dark' : false;
    }
    return false;
  });

  // Task data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);

  // Filter & Search states
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('smart_mix');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [explainingTask, setExplainingTask] = useState<Task | null>(null);
  const [isApiInspectorOpen, setIsApiInspectorOpen] = useState<boolean>(false);

  // Sync Dark mode with DOM
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('taskpulse_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('taskpulse_theme', 'light');
    }
  }, [darkMode]);

  // Initial user session verification
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getCurrentUser()
        .then((u) => {
          setUser(u);
        })
        .catch(() => {
          // If token invalid, clear
          api.logout();
          setUser(null);
        })
        .finally(() => {
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Fetch tasks and stats from backend
  const loadTasksAndStats = useCallback(async () => {
    if (!user) return;
    setLoadingTasks(true);
    try {
      const [fetchedTasks, fetchedStats] = await Promise.all([
        api.getTasks(),
        api.getStats().catch(() => null),
      ]);
      setTasks(fetchedTasks);
      if (fetchedStats) setStats(fetchedStats);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTasksAndStats();
    } else {
      setTasks([]);
      setStats(null);
    }
  }, [user, loadTasksAndStats]);

  // Handle Authentication Success
  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setActiveTab('tasks');
  };

  // Handle Logout
  const handleLogout = () => {
    api.logout();
    setUser(null);
    setActiveTab('tasks');
    sound.playPop();
  };

  // --- Task CRUD Handlers ---

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      if (editingTask) {
        // Update task
        const updated = await api.updateTask(editingTask.id, taskData);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        // Create new task
        const created = await api.createTask(taskData);
        setTasks((prev) => [created, ...prev]);
      }
      // Refresh stats
      api.getStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setIsTaskModalOpen(false);
      setEditingTask(null);
    }
  };

  const handleToggleTask = async (id: string) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            status: nextCompleted ? 'completed' : 'pending',
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );

    try {
      const res = await api.toggleTask(id);
      if (res.user) setUser(res.user);
      api.getStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('Failed to toggle task:', err);
      // Revert if error
      loadTasksAndStats();
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.deleteTask(id);
      api.getStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('Failed to delete task:', err);
      loadTasksAndStats();
    }
  };

  const handleToggleStar = async (task: Task) => {
    const nextStarred = !task.isStarred;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, isStarred: nextStarred } : t))
    );
    try {
      await api.updateTask(task.id, { isStarred: nextStarred });
    } catch (err) {
      console.error('Failed to star task:', err);
    }
  };

  const handleTogglePin = async (task: Task) => {
    const nextPinned = !task.isPinned;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, isPinned: nextPinned } : t))
    );
    try {
      await api.updateTask(task.id, { isPinned: nextPinned });
    } catch (err) {
      console.error('Failed to pin task:', err);
    }
  };

  const handleToggleSubtask = async (task: Task, subtaskId: string) => {
    const updatedSubtasks = (task.subtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, subtasks: updatedSubtasks } : t))
    );
    try {
      await api.updateTask(task.id, { subtasks: updatedSubtasks });
    } catch (err) {
      console.error('Failed to update subtask:', err);
    }
  };

  const handleBulkComplete = async () => {
    sound.playComplete();
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        completed: true,
        status: 'completed',
        completedAt: new Date().toISOString(),
      }))
    );
    try {
      await api.bulkComplete();
      loadTasksAndStats();
    } catch (err) {
      console.error('Failed bulk complete:', err);
    }
  };

  const handleBulkDelete = async () => {
    sound.playDelete();
    setTasks((prev) => prev.filter((t) => !t.completed));
    try {
      await api.bulkDeleteCompleted();
      loadTasksAndStats();
    } catch (err) {
      console.error('Failed bulk delete:', err);
    }
  };

  const handleUpdateProfile = async (name: string) => {
    try {
      const updatedUser = await api.updateProfile(name);
      setUser(updatedUser);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const unreadOverdueCount = tasks.filter(
    (t) => !t.completed && new Date(t.deadline).getTime() < new Date().getTime()
  ).length;

  return (
    <MobileFrame
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onOpenCreateModal={() => {
        setEditingTask(null);
        setIsTaskModalOpen(true);
      }}
      onOpenApiInspector={() => setIsApiInspectorOpen(true)}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode(!darkMode)}
      isLoggedIn={!!user}
      unreadCount={unreadOverdueCount}
    >
      {authLoading ? (
        <div className="flex-1 flex items-center justify-center p-6 text-xs text-slate-500">
          Connecting to Node.js backend...
        </div>
      ) : !user ? (
        <AuthScreen onSuccess={handleAuthSuccess} />
      ) : (
        <>
          {activeTab === 'tasks' && (
            <TaskList
              tasks={tasks}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              selectedPriority={selectedPriority}
              setSelectedPriority={setSelectedPriority}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              sortMode={sortMode}
              setSortMode={setSortMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onToggleTask={handleToggleTask}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              onToggleStar={handleToggleStar}
              onTogglePin={handleTogglePin}
              onToggleSubtask={handleToggleSubtask}
              onExplainScore={(task) => setExplainingTask(task)}
              onBulkComplete={handleBulkComplete}
              onBulkDelete={handleBulkDelete}
              onOpenCreateModal={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onOpenCreateModal={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
            />
          )}

          {activeTab === 'matrix' && (
            <MatrixView
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onOpenCreateModal={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView stats={stats} user={user} />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              user={user}
              tasks={tasks}
              onUpdateProfile={handleUpdateProfile}
              onLogout={handleLogout}
              onOpenApiInspector={() => setIsApiInspectorOpen(true)}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
            />
          )}
        </>
      )}

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
      />

      {/* Priority-Deadline Mix Algorithm Explainer Modal */}
      <SmartMixExplainerModal
        isOpen={!!explainingTask}
        onClose={() => setExplainingTask(null)}
        task={explainingTask}
      />

      {/* Live Node.js REST API Inspector Modal */}
      <ApiInspectorModal
        isOpen={isApiInspectorOpen}
        onClose={() => setIsApiInspectorOpen(false)}
      />
    </MobileFrame>
  );
}
