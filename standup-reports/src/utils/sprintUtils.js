import { differenceInDays, parseISO, isAfter, isBefore, isWithinInterval, format } from 'date-fns';

/**
 * Calculate sprint progress percentage
 */
export const calculateSprintProgress = (sprint) => {
  if (!sprint || !sprint.start_date || !sprint.end_date) return 0;
  
  const today = new Date();
  const startDate = parseISO(sprint.start_date);
  const endDate = parseISO(sprint.end_date);
  
  if (isBefore(today, startDate)) return 0;
  if (isAfter(today, endDate)) return 100;
  
  const totalDays = differenceInDays(endDate, startDate);
  const elapsedDays = differenceInDays(today, startDate);
  
  return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
};

/**
 * Calculate sprint velocity (story points completed)
 */
export const calculateSprintVelocity = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  return completedTasks.reduce((sum, task) => sum + (task.story_points || 0), 0);
};

/**
 * Calculate sprint capacity (total story points)
 */
export const calculateSprintCapacity = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  
  return tasks.reduce((sum, task) => sum + (task.story_points || 0), 0);
};

/**
 * Get sprint status based on dates
 */
export const getSprintStatus = (sprint) => {
  if (!sprint || !sprint.start_date || !sprint.end_date) return 'Unknown';
  
  if (sprint.status === 'Completed') return 'Completed';
  
  const today = new Date();
  const startDate = parseISO(sprint.start_date);
  const endDate = parseISO(sprint.end_date);
  
  if (isBefore(today, startDate)) return 'Planning';
  if (isWithinInterval(today, { start: startDate, end: endDate })) return 'Active';
  if (isAfter(today, endDate)) return 'Overdue';
  
  return sprint.status || 'Planning';
};

/**
 * Calculate remaining days in sprint
 */
export const getRemainingDays = (sprint) => {
  if (!sprint || !sprint.end_date) return 0;
  
  const today = new Date();
  const endDate = parseISO(sprint.end_date);
  
  if (isAfter(today, endDate)) return 0;
  
  return differenceInDays(endDate, today);
};

/**
 * Calculate sprint health score (0-100)
 */
export const calculateSprintHealth = (sprint, tasks) => {
  if (!sprint || !tasks || tasks.length === 0) return 0;
  
  let healthScore = 100;
  
  // Factor 1: Task completion rate
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const totalTasks = tasks.length;
  const completionRate = (completedTasks / totalTasks) * 100;
  const progress = calculateSprintProgress(sprint);
  
  // If progress is ahead of completion, reduce health
  if (progress > completionRate) {
    healthScore -= Math.min(30, (progress - completionRate) * 0.5);
  }
  
  // Factor 2: Overdue tasks
  const today = new Date();
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'Completed') return false;
    return isAfter(today, parseISO(t.due_date));
  }).length;
  
  if (overdueTasks > 0) {
    healthScore -= Math.min(20, overdueTasks * 5);
  }
  
  // Factor 3: Tasks in review
  const reviewTasks = tasks.filter(t => t.status === 'Review').length;
  if (reviewTasks > totalTasks * 0.3) {
    healthScore -= 10;
  }
  
  return Math.max(0, Math.min(100, healthScore));
};

/**
 * Get health status color
 */
export const getHealthColor = (health) => {
  if (health >= 80) return 'green';
  if (health >= 60) return 'amber';
  return 'red';
};

/**
 * Calculate burndown data for chart
 */
export const calculateBurndownData = (sprint, tasks) => {
  if (!sprint || !tasks || tasks.length === 0) return [];
  
  const startDate = parseISO(sprint.start_date);
  const endDate = parseISO(sprint.end_date);
  const totalDays = differenceInDays(endDate, startDate) + 1;
  
  const totalPoints = calculateSprintCapacity(tasks);
  const idealBurnRate = totalPoints / totalDays;
  
  const burndownData = [];
  
  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    
    // Ideal line
    const idealRemaining = totalPoints - (idealBurnRate * i);
    
    // Actual line (simplified - in real app, track daily completions)
    const today = new Date();
    let actualRemaining = totalPoints;
    
    if (isAfter(currentDate, today)) {
      // Future dates - use current remaining
      const completedPoints = calculateSprintVelocity(tasks);
      actualRemaining = totalPoints - completedPoints;
    } else {
      // Past dates - calculate based on task completion dates
      const completedPoints = tasks
        .filter(t => t.status === 'Completed' && t.updated_at && isBefore(parseISO(t.updated_at), currentDate))
        .reduce((sum, task) => sum + (task.story_points || 0), 0);
      actualRemaining = totalPoints - completedPoints;
    }
    
    burndownData.push({
      date: format(currentDate, 'MMM dd'),
      ideal: Math.max(0, idealRemaining),
      actual: Math.max(0, actualRemaining)
    });
  }
  
  return burndownData;
};

/**
 * Group tasks by status
 */
export const groupTasksByStatus = (tasks) => {
  return {
    'To Do': tasks.filter(t => t.status === 'To Do'),
    'In Progress': tasks.filter(t => t.status === 'In Progress'),
    'Review': tasks.filter(t => t.status === 'Review'),
    'Completed': tasks.filter(t => t.status === 'Completed')
  };
};

/**
 * Calculate task distribution
 */
export const calculateTaskDistribution = (tasks) => {
  const total = tasks.length;
  if (total === 0) return {};
  
  return {
    'To Do': {
      count: tasks.filter(t => t.status === 'To Do').length,
      percentage: (tasks.filter(t => t.status === 'To Do').length / total) * 100
    },
    'In Progress': {
      count: tasks.filter(t => t.status === 'In Progress').length,
      percentage: (tasks.filter(t => t.status === 'In Progress').length / total) * 100
    },
    'Review': {
      count: tasks.filter(t => t.status === 'Review').length,
      percentage: (tasks.filter(t => t.status === 'Review').length / total) * 100
    },
    'Completed': {
      count: tasks.filter(t => t.status === 'Completed').length,
      percentage: (tasks.filter(t => t.status === 'Completed').length / total) * 100
    }
  };
};

/**
 * Format sprint date range
 */
export const formatSprintDates = (sprint) => {
  if (!sprint || !sprint.start_date || !sprint.end_date) return 'No dates set';
  
  const startDate = parseISO(sprint.start_date);
  const endDate = parseISO(sprint.end_date);
  
  return `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
};

/**
 * Get sprint duration in days
 */
export const getSprintDuration = (sprint) => {
  if (!sprint || !sprint.start_date || !sprint.end_date) return 0;
  
  const startDate = parseISO(sprint.start_date);
  const endDate = parseISO(sprint.end_date);
  
  return differenceInDays(endDate, startDate) + 1;
};

/**
 * Check if sprint can be started
 */
export const canStartSprint = (sprint, tasks) => {
  if (!sprint) return false;
  
  const status = getSprintStatus(sprint);
  
  // Can start if in Planning and has tasks
  return status === 'Planning' && tasks && tasks.length > 0;
};

/**
 * Check if sprint can be completed
 */
export const canCompleteSprint = (sprint, tasks) => {
  if (!sprint) return false;
  
  const status = getSprintStatus(sprint);
  
  // Can complete if Active or Overdue
  return status === 'Active' || status === 'Overdue';
};

/**
 * Get sprint metrics summary
 */
export const getSprintMetrics = (sprint, tasks) => {
  if (!sprint || !tasks) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      completionRate: 0,
      velocity: 0,
      capacity: 0,
      remainingDays: 0,
      progress: 0,
      health: 0
    };
  }
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  
  return {
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    velocity: calculateSprintVelocity(tasks),
    capacity: calculateSprintCapacity(tasks),
    remainingDays: getRemainingDays(sprint),
    progress: calculateSprintProgress(sprint),
    health: calculateSprintHealth(sprint, tasks)
  };
};
