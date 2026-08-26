export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskCategory = 
  | 'work' 
  | 'personal' 
  | 'study' 
  | 'health' 
  | 'finance' 
  | 'shopping' 
  | 'home' 
  | 'urgent' 
  | string;

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  scheduledStart?: string;
  deadline: string; // ISO String
  priority: TaskPriority;
  category: TaskCategory;
  tags: string[];
  status: TaskStatus;
  completed: boolean;
  completedAt?: string;
  subtasks: Subtask[];
  estimatedMinutes?: number;
  isPinned?: boolean;
  isStarred?: boolean;
  createdAt: string;
  updatedAt: string;
  urgencyScore?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  streakDays: number;
  tasksCompletedCount: number;
  productivityScore: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export type SortMode = 
  | 'smart_mix' 
  | 'deadline_asc' 
  | 'deadline_desc' 
  | 'priority_desc' 
  | 'priority_asc' 
  | 'created_desc' 
  | 'title_asc';

export type FilterStatus = 'all' | 'active' | 'completed' | 'overdue' | 'today' | 'upcoming';

export interface TaskFilterOptions {
  status: FilterStatus;
  priority?: TaskPriority | 'all';
  category?: string;
  searchQuery?: string;
  sortMode: SortMode;
}

export interface StatsSummary {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  inProgress: number;
  completionRate: number;
  streakDays: number;
  productivityScore: number;
  priorityBreakdown: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  categoryBreakdown: Record<string, number>;
  completionTrend: { day: string; count: number }[];
}
