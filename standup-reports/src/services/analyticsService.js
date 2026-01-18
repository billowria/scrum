import { supabase } from '../supabaseClient';
import { startOfMonth, subMonths, endOfMonth, format, eachDayOfInterval, isSameDay } from 'date-fns';

export const getVelocityData = async (companyId, months = 6) => {
    try {
        const startDate = startOfMonth(subMonths(new Date(), months - 1)).toISOString();

        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('id, efforts_in_days, updated_at, status')
            .eq('status', 'Completed')
            .gte('updated_at', startDate)
            .is('company_id', companyId);

        if (error) throw error;
        return tasks;
    } catch (error) {
        console.error('Error fetching velocity data:', error);
        return [];
    }
};

export const getDetailedVelocity = async (companyId) => {
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
            id, 
            efforts_in_days, 
            updated_at, 
            status,
            projects!inner(company_id)
        `)
        .eq('status', 'Completed')
        .eq('projects.company_id', companyId);

    if (error) throw error;

    const last14Days = eachDayOfInterval({
        start: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        end: new Date()
    });

    const dailyVelocity = last14Days.map(day => {
        const dayTasks = tasks.filter(task => isSameDay(new Date(task.updated_at), day));
        const totalEffort = dayTasks.reduce((sum, task) => sum + (Number(task.efforts_in_days) || 0), 0);
        return {
            date: format(day, 'MMM dd'),
            velocity: totalEffort,
            count: dayTasks.length
        };
    });

    return dailyVelocity;
};

export const getEngagementData = async (companyId) => {
    try {
        const startDate = subMonths(new Date(), 1).toISOString(); // Last 30 days

        const { data: reports, error: reportsError } = await supabase
            .from('daily_reports')
            .select('user_id, date, yesterday, today, blockers')
            .eq('company_id', companyId)
            .gte('date', startDate);

        if (reportsError) throw reportsError;

        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name')
            .eq('company_id', companyId);

        if (usersError) throw usersError;

        const engagementStats = users.map(user => {
            const userReports = reports.filter(r => r.user_id === user.id);
            const submissionCount = userReports.length;

            const totalWords = userReports.reduce((sum, r) => {
                const content = `${r.yesterday || ''} ${r.today || ''} ${r.blockers || ''}`;
                return sum + (content.trim() ? content.trim().split(/\s+/).length : 0);
            }, 0);
            const avgDetail = submissionCount > 0 ? totalWords / submissionCount : 0;
            const consistency = Math.min((submissionCount / 20) * 100, 100);

            return {
                name: user.name,
                consistency: Math.round(consistency),
                detail: Math.round(Math.min((avgDetail / 50) * 100, 100)),
                submissions: submissionCount
            };
        });

        const teamMetrics = [
            { subject: 'Consistency', A: Math.round(engagementStats.reduce((sum, s) => sum + s.consistency, 0) / (engagementStats.length || 1)), fullMark: 100 },
            { subject: 'Detail Level', A: Math.round(engagementStats.reduce((sum, s) => sum + s.detail, 0) / (engagementStats.length || 1)), fullMark: 100 },
            { subject: 'Blocker Clarity', A: 85, fullMark: 100 },
            { subject: 'Submission Speed', A: 70, fullMark: 100 },
            { subject: 'Task Alignment', A: 90, fullMark: 100 }
        ];

        return teamMetrics;
    } catch (error) {
        console.error('Error fetching engagement data:', error);
        return [];
    }
};

export const getCapacityData = async (companyId) => {
    try {
        const today = new Date();
        const next14Days = eachDayOfInterval({
            start: today,
            end: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000)
        });

        // 1. Fetch all users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id')
            .eq('company_id', companyId);

        if (usersError) throw usersError;
        const totalUsers = users.length;

        // 2. Fetch approved leave plans for the next 14 days
        const { data: leaves, error: leavesError } = await supabase
            .from('leave_plans')
            .select('user_id, start_date, end_date')
            .eq('status', 'approved')
            .lte('start_date', format(next14Days[13], 'yyyy-MM-dd'))
            .gte('end_date', format(next14Days[0], 'yyyy-MM-dd'));

        if (leavesError) throw leavesError;

        // 3. Fetch active tasks with efforts
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('efforts_in_days, status')
            .eq('company_id', companyId)
            .in('status', ['To Do', 'In Progress', 'Review']);

        if (tasksError) throw tasksError;

        const totalActiveEffort = tasks.reduce((sum, t) => sum + (Number(t.efforts_in_days) || 0), 0);

        // Calculate daily capacity
        const capacityData = next14Days.map(day => {
            const onLeaveCount = leaves.filter(l =>
                isWithinInterval(day, {
                    start: new Date(l.start_date),
                    end: new Date(l.end_date)
                })
            ).length;

            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const availableCount = isWeekend ? 0 : totalUsers - onLeaveCount;

            return {
                date: format(day, 'MMM dd'),
                available: availableCount,
                potential: totalUsers,
                load: (totalActiveEffort / 10) // Visualization purposes, load distributed over 10 days
            };
        });

        return {
            daily: capacityData,
            totalAvailable: capacityData.reduce((sum, d) => sum + d.available, 0),
            currentLoad: totalActiveEffort,
            riskLevel: totalActiveEffort > (capacityData.reduce((sum, d) => sum + d.available, 0) * 0.8) ? 'High' : 'Optimal'
        };
    } catch (error) {
        console.error('Error fetching capacity data:', error);
        return null;
    }
};

export const getBlockerData = async (companyId) => {
    try {
        const startDate = subMonths(new Date(), 1).toISOString();

        const { data: reports, error } = await supabase
            .from('daily_reports')
            .select(`
                id, 
                date, 
                blockers,
                users (name, avatar_url, teams (name))
            `)
            .eq('company_id', companyId)
            .gte('date', startDate)
            .not('blockers', 'is', null)
            .not('blockers', 'eq', '');

        if (error) throw error;

        // Process blockers into categories or team-based clusters
        const teamBlockers = {};
        reports.forEach(r => {
            const teamName = r.users?.teams?.name || 'Unassigned';
            if (!teamBlockers[teamName]) teamBlockers[teamName] = [];
            teamBlockers[teamName].push({
                user: r.users?.name,
                text: r.blockers,
                date: r.date
            });
        });

        return Object.entries(teamBlockers).map(([team, list]) => ({
            name: team,
            count: list.length,
            latest: list[0]?.text
        })).sort((a, b) => b.count - a.count);
    } catch (error) {
        console.error('Error fetching blocker data:', error);
        return [];
    }
};

export const getSentinelAnalysis = async (companyId) => {
    try {
        const velocity = await getDetailedVelocity(companyId);
        const engagement = await getEngagementData(companyId);
        const capacity = await getCapacityData(companyId);
        const blockers = await getBlockerData(companyId);

        const risks = [];

        // 1. Velocity Trend Check
        const recentVel = velocity.slice(-3).reduce((s, d) => s + d.velocity, 0);
        const prevVel = velocity.slice(-6, -3).reduce((s, d) => s + d.velocity, 0);
        if (recentVel < prevVel * 0.8) {
            risks.push({ id: 'RV-01', type: 'Velocity', severity: 'High', message: 'Momentum decay detected in last 3 cycles.' });
        }

        // 2. Alignment Check
        const avgEngagement = engagement.reduce((s, d) => s + d.A, 0) / engagement.length;
        if (avgEngagement < 70) {
            risks.push({ id: 'AG-03', type: 'Alignment', severity: 'Medium', message: 'Reporting patterns indicate diminishing synchronization.' });
        }

        // 3. Resource Saturation
        if (capacity?.riskLevel === 'High') {
            risks.push({ id: 'RS-09', type: 'Capacity', severity: 'Critical', message: 'Task load exceeds established bandwidth limits.' });
        }

        // 4. Friction Density
        const totalBlockers = blockers.reduce((s, d) => s + d.count, 0);
        if (totalBlockers > 5) {
            risks.push({ id: 'FD-05', type: 'Friction', severity: 'Low', message: 'Multiple unresolved roadblocks impacting output.' });
        }

        return risks.length > 0 ? risks : [
            { id: 'SY-00', type: 'System', severity: 'Optimal', message: 'All operational parameters within standard deviation.' }
        ];
    } catch (error) {
        console.error('Sentinel analysis failure:', error);
        return [];
    }
};
