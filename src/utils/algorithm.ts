import { Task, TaskPriority } from '../types';

export interface ScoreExplanation {
  baseWeight: number;
  priorityLabel: string;
  hoursRemaining: number;
  timeMultiplier: number;
  timeLabel: string;
  bonuses: { label: string; points: number }[];
  totalScore: number;
  isOverdue: boolean;
}

const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  urgent: 100,
  high: 70,
  medium: 40,
  low: 15,
};

/**
 * Calculates the Smart Priority-Deadline Mix Urgency Score for a task.
 * Higher score = higher urgency & priority to tackle next.
 */
export function calculateUrgencyScore(task: Task, now: Date = new Date()): number {
  if (task.completed) {
    return 0; // Completed tasks have lowest urgency
  }

  const baseWeight = PRIORITY_WEIGHTS[task.priority] || 40;
  const deadlineTime = new Date(task.deadline).getTime();
  const nowTime = now.getTime();
  const diffHours = (deadlineTime - nowTime) / (1000 * 60 * 60);

  let multiplier = 1.0;
  let isOverdue = false;

  if (diffHours < 0) {
    // Overdue: urgency scales up heavily
    isOverdue = true;
    const hoursPast = Math.abs(diffHours);
    multiplier = 2.5 + Math.min(hoursPast / 24, 2.5); // Cap bonus to avoid infinity
  } else if (diffHours <= 2) {
    multiplier = 2.2; // Critical window
  } else if (diffHours <= 6) {
    multiplier = 1.8;
  } else if (diffHours <= 24) {
    multiplier = 1.4; // Due today
  } else if (diffHours <= 48) {
    multiplier = 1.1; // Due tomorrow
  } else if (diffHours <= 168) {
    multiplier = 0.8; // Due this week
  } else {
    multiplier = 0.5; // Far out
  }

  let bonuses = 0;
  if (task.isPinned) bonuses += 30;
  if (task.isStarred) bonuses += 15;

  // If task has subtasks in progress, give slight momentum bonus
  if (task.subtasks && task.subtasks.length > 0) {
    const completedCount = task.subtasks.filter((s) => s.completed).length;
    if (completedCount > 0 && completedCount < task.subtasks.length) {
      bonuses += 10;
    }
  }

  const rawScore = baseWeight * multiplier + bonuses;
  return Math.round(rawScore);
}

/**
 * Generates an analytical breakdown of why a task has its current score
 */
export function explainUrgencyScore(task: Task, now: Date = new Date()): ScoreExplanation {
  const baseWeight = PRIORITY_WEIGHTS[task.priority] || 40;
  const deadlineTime = new Date(task.deadline).getTime();
  const nowTime = now.getTime();
  const diffHours = (deadlineTime - nowTime) / (1000 * 60 * 60);

  let multiplier = 1.0;
  let timeLabel = '';
  let isOverdue = false;

  if (task.completed) {
    return {
      baseWeight,
      priorityLabel: task.priority.toUpperCase(),
      hoursRemaining: diffHours,
      timeMultiplier: 0,
      timeLabel: 'Completed (Archived)',
      bonuses: [],
      totalScore: 0,
      isOverdue: false,
    };
  }

  if (diffHours < 0) {
    isOverdue = true;
    const hoursPast = Math.abs(diffHours);
    multiplier = Number((2.5 + Math.min(hoursPast / 24, 2.5)).toFixed(2));
    timeLabel = `Overdue by ${Math.floor(hoursPast)}h (Urgency Multiplier ×${multiplier})`;
  } else if (diffHours <= 2) {
    multiplier = 2.2;
    timeLabel = `Due in < 2h (Imminent Deadline ×2.2)`;
  } else if (diffHours <= 6) {
    multiplier = 1.8;
    timeLabel = `Due in < 6h (High Urgency ×1.8)`;
  } else if (diffHours <= 24) {
    multiplier = 1.4;
    timeLabel = `Due Today within 24h (×1.4)`;
  } else if (diffHours <= 48) {
    multiplier = 1.1;
    timeLabel = `Due Tomorrow within 48h (×1.1)`;
  } else if (diffHours <= 168) {
    multiplier = 0.8;
    timeLabel = `Due this week (×0.8)`;
  } else {
    multiplier = 0.5;
    timeLabel = `Future task > 7 days (×0.5)`;
  }

  const bonusesList: { label: string; points: number }[] = [];
  if (task.isPinned) bonusesList.push({ label: 'Pinned Priority', points: 30 });
  if (task.isStarred) bonusesList.push({ label: 'Starred Task', points: 15 });

  if (task.subtasks && task.subtasks.length > 0) {
    const completedCount = task.subtasks.filter((s) => s.completed).length;
    if (completedCount > 0 && completedCount < task.subtasks.length) {
      bonusesList.push({ label: 'In-Progress Momentum', points: 10 });
    }
  }

  const bonusSum = bonusesList.reduce((acc, b) => acc + b.points, 0);
  const totalScore = Math.round(baseWeight * multiplier + bonusSum);

  return {
    baseWeight,
    priorityLabel: task.priority.toUpperCase(),
    hoursRemaining: Number(diffHours.toFixed(1)),
    timeMultiplier: multiplier,
    timeLabel,
    bonuses: bonusesList,
    totalScore,
    isOverdue,
  };
}

/**
 * Sorts an array of tasks according to the selected SortMode
 */
export function sortTasks(tasks: Task[], sortMode: string, now: Date = new Date()): Task[] {
  const tasksWithScores = tasks.map((t) => ({
    ...t,
    urgencyScore: calculateUrgencyScore(t, now),
  }));

  return [...tasksWithScores].sort((a, b) => {
    // Pinned tasks stay at top unless sorting completed
    if (a.isPinned && !b.isPinned && !a.completed && !b.completed) return -1;
    if (!a.isPinned && b.isPinned && !a.completed && !b.completed) return 1;

    switch (sortMode) {
      case 'smart_mix':
        // Active tasks with highest urgency first, completed tasks at bottom
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        return (b.urgencyScore || 0) - (a.urgencyScore || 0);

      case 'deadline_asc':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();

      case 'deadline_desc':
        return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();

      case 'priority_desc': {
        const pDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
        if (pDiff !== 0) return pDiff;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }

      case 'priority_asc': {
        const pDiff = PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority];
        if (pDiff !== 0) return pDiff;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }

      case 'created_desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

      case 'title_asc':
        return a.title.localeCompare(b.title);

      default:
        return (b.urgencyScore || 0) - (a.urgencyScore || 0);
    }
  });
}
