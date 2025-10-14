import { subDays, startOfDay, parseISO, endOfDay, differenceInDays } from 'date-fns';
import { supabase } from '../supabaseClient';

/**
 * Calculate duration between two dates in days (inclusive)
 */
const calculateDuration = (startDate, endDate) => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return differenceInDays(end, start) + 1;
};

/**
 * Fetches leave analysis data including patterns, utilization, and productivity impact.
 * @param {object} filters - Filter object containing dateRange, userIds, teamIds
 * @returns {Promise<object>} Leave analysis data
 */
export const getLeaveAnalysis = async (filters = {}) => {
  try {
    const { dateRange, userIds = [], teamIds = [] } = filters;
    const startDate = dateRange?.start ? startOfDay(parseISO(dateRange.start)) : subDays(new Date(), 90);
    const endDate = dateRange?.end ? endOfDay(parseISO(dateRange.end)) : new Date();

    // Build user query with filters
    let userQuery = supabase
      .from('users')
      .select('id, name, team_id');

    if (userIds.length > 0) {
      userQuery = userQuery.in('id', userIds);
    }

    if (teamIds.length > 0) {
      userQuery = userQuery.in('team_id', teamIds);
    }

    const { data: users, error: usersError } = await userQuery;
    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return { leavePatterns: [], utilization: {}, productivityImpact: {} };
    }

    const userIdsToFetch = users.map(u => u.id);

    // Get leave requests for the period
    const { data: leaveRequests, error: leaveError } = await supabase
      .from('leave_plans')
      .select(`
        id,
        user_id,
        leave_type,
        start_date,
        end_date,
        status,
        created_at,
        users!inner(name, team_id)
      `)
      .in('user_id', userIdsToFetch)
      .gte('start_date', startDate.toISOString())
      .lte('end_date', endDate.toISOString())
      .eq('status', 'Approved');

    if (leaveError) throw leaveError;

    // Get team productivity data (tasks completed during leave periods)
    const { data: tasksDuringLeave, error: tasksError } = await supabase
      .from('tasks')
      .select('assignee_id, status, updated_at')
      .in('assignee_id', userIdsToFetch)
      .eq('status', 'Completed')
      .gte('updated_at', startDate.toISOString())
      .lte('updated_at', endDate.toISOString());

    if (tasksError) throw tasksError;

    // Process leave patterns
    const leavePatterns = processLeavePatterns(leaveRequests || []);

    // Calculate utilization metrics
    const utilization = calculateLeaveUtilization(leaveRequests || [], users, startDate, endDate);

    // Analyze productivity impact
    const productivityImpact = analyzeProductivityImpact(leaveRequests || [], tasksDuringLeave || [], users);

    return {
      leavePatterns,
      utilization,
      productivityImpact
    };

  } catch (error) {
    console.error('Error fetching leave analysis:', error);
    return { leavePatterns: [], utilization: {}, productivityImpact: {} };
  }
};

/**
 * Process leave patterns from leave requests
 */
const processLeavePatterns = (leaveRequests) => {
  const patterns = {
    byType: {},
    byMonth: {},
    byDayOfWeek: {},
    averageDuration: 0,
    totalDays: 0
  };

  leaveRequests.forEach(request => {
    const duration = calculateDuration(request.start_date, request.end_date);
    patterns.totalDays += duration;

    // By type
    patterns.byType[request.leave_type] = (patterns.byType[request.leave_type] || 0) + duration;

    // By month
    const month = parseISO(request.start_date).toISOString().slice(0, 7);
    patterns.byMonth[month] = (patterns.byMonth[month] || 0) + duration;

    // By day of week (simplified - using start date)
    const dayOfWeek = parseISO(request.start_date).getDay();
    patterns.byDayOfWeek[dayOfWeek] = (patterns.byDayOfWeek[dayOfWeek] || 0) + 1;
  });

  patterns.averageDuration = leaveRequests.length > 0 ? patterns.totalDays / leaveRequests.length : 0;

  return patterns;
};

/**
 * Calculate leave utilization metrics
 */
const calculateLeaveUtilization = (leaveRequests, users, startDate, endDate) => {
  const totalDaysInPeriod = differenceInDays(endDate, startDate);
  const totalUserDays = users.length * totalDaysInPeriod;

  const utilizedDays = leaveRequests.reduce((total, request) => {
    return total + calculateDuration(request.start_date, request.end_date);
  }, 0);

  const utilizationRate = totalUserDays > 0 ? (utilizedDays / totalUserDays) * 100 : 0;

  // Calculate by user
  const byUser = users.map(user => {
    const userLeaves = leaveRequests.filter(r => r.user_id === user.id);
    const userLeaveDays = userLeaves.reduce((total, request) => {
      return total + calculateDuration(request.start_date, request.end_date);
    }, 0);

    return {
      userId: user.id,
      name: user.name,
      leaveDays: userLeaveDays,
      utilizationRate: (userLeaveDays / totalDaysInPeriod) * 100
    };
  });

  return {
    totalUtilizationRate: utilizationRate,
    totalLeaveDays: utilizedDays,
    byUser
  };
};

/**
 * Analyze productivity impact of leaves
 */
const analyzeProductivityImpact = (leaveRequests, tasksDuringLeave, users) => {
  // This is a simplified analysis - in reality, you'd need more complex logic
  // to determine actual productivity impact during leave periods

  const impact = {
    averageTasksDuringLeave: 0,
    teamProductivityDrop: 0,
    recommendations: []
  };

  if (leaveRequests.length > 0 && tasksDuringLeave.length > 0) {
    // Calculate average tasks completed during leave periods
    const totalLeaveDays = leaveRequests.reduce((total, request) => {
      return total + calculateDuration(request.start_date, request.end_date);
    }, 0);

    impact.averageTasksDuringLeave = tasksDuringLeave.length / leaveRequests.length;

    // Estimate productivity drop (simplified)
    impact.teamProductivityDrop = Math.min((totalLeaveDays / (users.length * 30)) * 100, 100);
  }

  // Generate recommendations
  if (impact.teamProductivityDrop > 20) {
    impact.recommendations.push('Consider redistributing workload during leave periods');
  }

  if (impact.averageTasksDuringLeave < 1) {
    impact.recommendations.push('Monitor task completion during absences');
  }

  return impact;
};