import { supabase } from '../supabaseClient';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * Calculates the difference in days between two date strings.
 * @param {string} start - The start date string.
 * @param {string} end - The end date string.
 * @returns {number} The difference in days.
 */
const calculateDuration = (start, end) => {
  if (!start || !end) return 0;
  return differenceInDays(parseISO(end), parseISO(start));
};

/**
 * Fetches and calculates flow metrics (Cycle Time, Lead Time, Throughput).
 * @param {Date} startDate - The start date for the analysis period.
 * @param {Date} endDate - The end date for the analysis period.
 * @param {string[]} [teamIds] - Optional array of team IDs to filter by.
 * @returns {Promise<object>} An object containing flow metrics data.
 */
export const getFlowMetrics = async (startDate, endDate, teamIds = []) => {
  try {
    // Step 1: Fetch tasks completed within the date range
    let tasksQuery = supabase
      .from('tasks')
      .select('id, created_at, team_id')
      .gte('updated_at', startDate.toISOString())
      .lte('updated_at', endDate.toISOString())
      .eq('status', 'Completed');

    if (teamIds.length > 0) {
      tasksQuery = tasksQuery.in('team_id', teamIds);
    }

    const { data: tasks, error: tasksError } = await tasksQuery;
    if (tasksError) throw tasksError;

    if (!tasks || tasks.length === 0) {
      return {
        cycleTime: { average: 0, distribution: [] },
        leadTime: { average: 0, distribution: [] },
        throughput: [],
      };
    }

    const taskIds = tasks.map(t => t.id);

    // Step 2: Fetch relevant task activities for the completed tasks
    const { data: activities, error: activitiesError } = await supabase
      .from('task_activities')
      .select('task_id, to_status, created_at')
      .in('task_id', taskIds)
      .in('to_status', ['In Progress', 'Completed']);

    if (activitiesError) throw activitiesError;

    // Step 3: Process data to calculate metrics
    const metrics = tasks.map(task => {
      const taskActivities = activities.filter(a => a.task_id === task.id);
      const startEvent = taskActivities.find(a => a.to_status === 'In Progress');
      const completeEvent = taskActivities.find(a => a.to_status === 'Completed');

      const leadTime = calculateDuration(task.created_at, completeEvent?.created_at);
      const cycleTime = calculateDuration(startEvent?.created_at, completeEvent?.created_at);

      return {
        ...task,
        leadTime,
        cycleTime,
        completed_at: completeEvent?.created_at,
      };
    });

    // Step 4: Calculate averages and distributions
    const validLeadTimes = metrics.map(m => m.leadTime).filter(t => t >= 0);
    const validCycleTimes = metrics.map(m => m.cycleTime).filter(t => t >= 0);

    const avgLeadTime = validLeadTimes.length > 0 ? Math.round(validLeadTimes.reduce((a, b) => a + b, 0) / validLeadTimes.length) : 0;
    const avgCycleTime = validCycleTimes.length > 0 ? Math.round(validCycleTimes.reduce((a, b) => a + b, 0) / validCycleTimes.length) : 0;

    // Group throughput by day
    const throughputData = metrics.reduce((acc, task) => {
      const date = parseISO(task.completed_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const throughput = Object.entries(throughputData).map(([date, count]) => ({ date, count }));

    return {
      leadTime: {
        average: avgLeadTime,
        distribution: validLeadTimes,
      },
      cycleTime: {
        average: avgCycleTime,
        distribution: validCycleTimes,
      },
      throughput,
    };

  } catch (error) {
    console.error("Error fetching flow metrics:", error);
    // Return empty state on error
    return {
      cycleTime: { average: 0, distribution: [] },
      leadTime: { average: 0, distribution: [] },
      throughput: [],
    };
  }
};

/**
 * Fetches data for the Work in Progress (WIP) Analysis widget.
 * @param {string[]} [teamIds] - Optional array of team IDs to filter by.
 * @returns {Promise<object>} An object containing WIP analysis data.
 */
export const getWipAnalysis = async (teamIds = []) => {
  try {
    // 1. Get all tasks currently In Progress
    let wipTasksQuery = supabase
      .from('tasks')
      .select('id, title, created_at')
      .eq('status', 'In Progress');

    if (teamIds.length > 0) {
      wipTasksQuery = wipTasksQuery.in('team_id', teamIds);
    }

    const { data: wipTasks, error: wipTasksError } = await wipTasksQuery;
    if (wipTasksError) throw wipTasksError;

    if (!wipTasks || wipTasks.length === 0) {
      return { wipTrend: [], wipAging: [] };
    }

    const taskIds = wipTasks.map(t => t.id);

    // 2. Find the latest 'In Progress' activity for each of these tasks
    const { data: activities, error: activitiesError } = await supabase
      .from('task_activities')
      .select('task_id, created_at')
      .in('task_id', taskIds)
      .eq('to_status', 'In Progress')
      .order('created_at', { ascending: false });

    if (activitiesError) throw activitiesError;

    // Create a map of the most recent 'In Progress' activity for each task
    const latestProgressActivities = activities.reduce((acc, activity) => {
      if (!acc[activity.task_id]) {
        acc[activity.task_id] = activity;
      }
      return acc;
    }, {});

    // 3. Calculate WIP Aging
    const wipAging = wipTasks.map(task => {
      const progressActivity = latestProgressActivities[task.id];
      const startDate = progressActivity ? progressActivity.created_at : task.created_at;
      const age = calculateDuration(startDate, new Date().toISOString());
      return {
        name: task.title,
        age,
      };
    }).sort((a, b) => b.age - a.age); // Sort by oldest first

    // 4. Calculate WIP Trend (tasks moved to 'In Progress' per day)
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
    const { data: trendActivities, error: trendError } = await supabase
      .from('task_activities')
      .select('created_at, task_id')
      .eq('to_status', 'In Progress')
      .gte('created_at', thirtyDaysAgo);

    if (trendError) throw trendError;

    const wipTrendData = trendActivities.reduce((acc, activity) => {
      const date = parseISO(activity.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const wipTrend = Object.entries(wipTrendData).map(([date, count]) => ({ date, count }));

    return { wipTrend, wipAging };

  } catch (error) {
    console.error("Error fetching WIP analysis:", error);
    return { wipTrend: [], wipAging: [] };
  }
};

/**
 * Fetches and analyzes blocker data from daily reports.
 * @param {Date} startDate - The start date for the analysis period.
 * @param {Date} endDate - The end date for the analysis period.
 * @param {string[]} [teamIds] - Optional array of team IDs to filter by.
 * @returns {Promise<object>} An object containing blocker analysis data.
 */
export const getBlockerAnalysis = async (startDate, endDate, teamIds = []) => {
  try {
    let query = supabase
      .from('daily_reports')
      .select('blockers, created_at, user_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('blockers', 'is', null)
      .neq('blockers', '');

    // This part of the query is not directly supported and would require a join.
    // We will filter client-side for now if teamIds are provided.
    // if (teamIds.length > 0) {
    //   query = query.in('users.team_id', teamIds);
    // }

    const { data: reports, error } = await query;
    if (error) throw error;

    // Process Blocker Trends
    const blockerTrendData = reports.reduce((acc, report) => {
      const date = parseISO(report.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    const blockerTrend = Object.entries(blockerTrendData).map(([date, count]) => ({ date, count }));

    // Process Blocker Keywords
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'in', 'out', 'over', 'with',
      'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ourselves',
      'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their', 'theirs',
      'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'not', 'no', 'waiting', 'for', 'on', 'of'
    ]);

    const wordCounts = reports.reduce((acc, report) => {
      const words = report.blockers.toLowerCase().split(/\s+|\.|,/).filter(word => word.length > 2 && !stopWords.has(word));
      words.forEach(word => {
        acc[word] = (acc[word] || 0) + 1;
      });
      return acc;
    }, {});

    const blockerKeywords = Object.entries(wordCounts)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Get top 20 keywords

    return { blockerTrend, blockerKeywords };

  } catch (error) {
    console.error("Error fetching blocker analysis:", error);
    return { blockerTrend: [], blockerKeywords: [] };
  }
};