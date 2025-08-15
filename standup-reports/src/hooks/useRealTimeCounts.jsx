import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useRealTimeCounts = (user) => {
  const [counts, setCounts] = useState({
    tasks: 0,
    notifications: 0,
    leaveRequests: 0,
    projects: 0,
    achievements: 0,
    teamMembers: 0,
    reports: 0
  });

  const fetchCounts = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      const countsData = {};

      // Fetch tasks count (schema uses assignee_id and task_status enum)
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id')
        .eq('assignee_id', user.id)
        .in('status', ['To Do', 'In Progress']);
      countsData.tasks = tasksData?.length || 0;

      // Unread notifications proxy via announcement_reads
      const { data: readsData } = await supabase
        .from('announcement_reads')
        .select('id')
        .eq('user_id', user.id)
        .eq('read', false);
      countsData.notifications = readsData?.length || 0;

      // Fetch projects count (for managers: all projects, for others: assigned projects)
      if (user.role === 'manager' || user.role === 'admin') {
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id');
        countsData.projects = projectsData?.length || 0;
      } else {
        const { data: projectsData } = await supabase
          .from('project_assignments')
          .select('id')
          .eq('user_id', user.id);
        countsData.projects = projectsData?.length || 0;
      }

      // Fetch achievements count
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', user.id);
      countsData.achievements = achievementsData?.length || 0;

      // Fetch team members count (for managers only)
      if (user.role === 'manager' || user.role === 'admin') {
        const { data: teamMembersData } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'developer');
        countsData.teamMembers = teamMembersData?.length || 0;
      }

      // Fetch pending leave requests count (for managers only)
      if (user.role === 'manager' || user.role === 'admin') {
        const { data: leaveRequestsData } = await supabase
          .from('leave_plans')
          .select('id')
          .eq('status', 'pending');
        countsData.leaveRequests = leaveRequestsData?.length || 0;
      }

      // Fetch recent daily reports for this user (last 7 days)
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: reportsData } = await supabase
        .from('daily_reports')
        .select('id')
        .gte('created_at', since)
        .eq('user_id', user.id);
      countsData.reports = reportsData?.length || 0;

      setCounts(countsData);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  useEffect(() => {
    fetchCounts();
    
    // Set up interval to refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    
    return () => clearInterval(interval);
  }, [user, fetchCounts]);

  return counts;
}; 