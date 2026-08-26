import { AuthResponse, StatsSummary, Task, TaskFilterOptions, User } from '../types';

const TOKEN_KEY = 'taskpulse_auth_token';
const USER_KEY = 'taskpulse_auth_user';

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  }

  public getSavedUser(): User | null {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(USER_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  public setSavedUser(user: User | null) {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({ error: 'Invalid JSON response from server' }));

    if (!response.ok) {
      const errorMsg = data?.error || `HTTP error ${response.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // --- AUTH ---
  async register(name: string, email: string, pass: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: pass }),
    });
    this.setToken(res.token);
    this.setSavedUser(res.user);
    return res;
  }

  async login(email: string, pass: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
    this.setToken(res.token);
    this.setSavedUser(res.user);
    return res;
  }

  async getCurrentUser(): Promise<User> {
    const user = await this.request<User>('/api/auth/me');
    this.setSavedUser(user);
    return user;
  }

  async updateProfile(name?: string, avatarUrl?: string): Promise<User> {
    const user = await this.request<User>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, avatarUrl }),
    });
    this.setSavedUser(user);
    return user;
  }

  logout() {
    this.setToken(null);
    this.setSavedUser(null);
  }

  // --- TASKS ---
  async getTasks(filters?: Partial<TaskFilterOptions>): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.priority && filters.priority !== 'all') params.append('priority', filters.priority);
    if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters?.searchQuery) params.append('q', filters.searchQuery);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Task[]>(`/api/tasks${query}`);
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    return this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async toggleTask(id: string): Promise<{ task: Task; user: User }> {
    const res = await this.request<{ task: Task; user: User }>(`/api/tasks/${id}/toggle`, {
      method: 'PATCH',
    });
    if (res.user) {
      this.setSavedUser(res.user);
    }
    return res;
  }

  async deleteTask(id: string): Promise<{ message: string; task: Task }> {
    return this.request<{ message: string; task: Task }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkComplete(): Promise<{ message: string; count: number }> {
    return this.request<{ message: string; count: number }>('/api/tasks/bulk-complete', {
      method: 'POST',
    });
  }

  async bulkDeleteCompleted(): Promise<{ message: string; count: number }> {
    return this.request<{ message: string; count: number }>('/api/tasks/bulk-delete', {
      method: 'DELETE',
    });
  }

  // --- STATS ---
  async getStats(): Promise<StatsSummary> {
    return this.request<StatsSummary>('/api/stats');
  }

  // --- API INFO ---
  async getApiRoutes(): Promise<{ title: string; description: string; endpoints: { method: string; path: string; description: string }[] }> {
    return this.request('/api/routes');
  }
}

export const api = new ApiService();
