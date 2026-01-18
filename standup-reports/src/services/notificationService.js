import { supabase } from '../supabaseClient';
import { format, parseISO, differenceInDays } from 'date-fns';

// Notification types enum (based on announcement notification_type)
export const NOTIFICATION_TYPES = {
  ANNOUNCEMENT: 'general',
  BOSS_MESSAGE: 'boss_message',
  LEAVE_REQUEST: 'leave_request',
  TIMESHEET_SUBMISSION: 'timesheet',
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMMENT: 'task_comment',
  PROJECT_UPDATE: 'project_update',
  SPRINT_UPDATE: 'sprint_update',
  SYSTEM_ALERT: 'system_alert',
  TASK_STATUS_CHANGE: 'task_status_change',
  MEETING: 'meeting',
  ACHIEVEMENT: 'achievement',
  URGENT: 'urgent',
  TEAM_COMMUNICATION: 'team_communication'
};

// Notification priority levels (matching database schema)
export const NOTIFICATION_PRIORITIES = {
  LOW: 'Low',
  NORMAL: 'Medium',
  HIGH: 'High',
  URGENT: 'Critical'
};

// Notification categories for filtering
export const NOTIFICATION_CATEGORIES = {
  ADMINISTRATIVE: 'administrative',
  PROJECT: 'project',
  TASK: 'task',
  SYSTEM: 'system',
  COMMUNICATION: 'communication',
  ACHIEVEMENT: 'achievement'
};

class NotificationService {
  constructor() {
    this.subscriptions = new Map();
    this.cache = new Map();
    this.filters = new Map();
    this.templates = new Map();
  }

  // Get notification icon based on type
  getNotificationIcon(type) {
    const iconMap = {
      [NOTIFICATION_TYPES.ANNOUNCEMENT]: 'FiMessageCircle',
      [NOTIFICATION_TYPES.LEAVE_REQUEST]: 'FiCalendar',
      [NOTIFICATION_TYPES.TIMESHEET_SUBMISSION]: 'FiClock',
      [NOTIFICATION_TYPES.TASK_CREATED]: 'FiPlus',
      [NOTIFICATION_TYPES.TASK_UPDATED]: 'FiEdit',
      [NOTIFICATION_TYPES.TASK_ASSIGNED]: 'FiUser',
      [NOTIFICATION_TYPES.TASK_COMMENT]: 'FiMessageSquare',
      [NOTIFICATION_TYPES.PROJECT_UPDATE]: 'FiFolder',
      [NOTIFICATION_TYPES.SPRINT_UPDATE]: 'FiTarget',
      [NOTIFICATION_TYPES.SYSTEM_ALERT]: 'FiAlertTriangle',
      [NOTIFICATION_TYPES.MEETING]: 'FiCalendar',
      [NOTIFICATION_TYPES.ACHIEVEMENT]: 'FiStar',
      [NOTIFICATION_TYPES.URGENT]: 'FiAlertCircle',
      [NOTIFICATION_TYPES.TEAM_COMMUNICATION]: 'FiMessageCircle'
    };
    return iconMap[type] || 'FiBell';
  }

  // Get notification color scheme based on type and priority
  getNotificationColors(type, priority = NOTIFICATION_PRIORITIES.NORMAL) {
    const baseColors = {
      [NOTIFICATION_TYPES.ANNOUNCEMENT]: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      [NOTIFICATION_TYPES.LEAVE_REQUEST]: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
      [NOTIFICATION_TYPES.TIMESHEET_SUBMISSION]: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      [NOTIFICATION_TYPES.TASK_CREATED]: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
      [NOTIFICATION_TYPES.TASK_UPDATED]: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
      [NOTIFICATION_TYPES.TASK_ASSIGNED]: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
      [NOTIFICATION_TYPES.TASK_COMMENT]: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
      [NOTIFICATION_TYPES.PROJECT_UPDATE]: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
      [NOTIFICATION_TYPES.SPRINT_UPDATE]: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
      [NOTIFICATION_TYPES.SYSTEM_ALERT]: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
      [NOTIFICATION_TYPES.TEAM_COMMUNICATION]: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' }
    };

    let colors = baseColors[type] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };

    // Enhance colors based on priority
    if (priority === NOTIFICATION_PRIORITIES.HIGH) {
      colors.bg = colors.bg.replace('-50', '-100');
      colors.border = colors.border.replace('-200', '-300');
    } else if (priority === NOTIFICATION_PRIORITIES.URGENT) {
      colors.bg = colors.bg.replace('-50', '-200');
      colors.border = colors.border.replace('-200', '-400');
      colors.text = colors.text.replace('-700', '-900');
    }

    return colors;
  }

  // Get notification category
  getNotificationCategory(type) {
    const categoryMap = {
      [NOTIFICATION_TYPES.ANNOUNCEMENT]: NOTIFICATION_CATEGORIES.COMMUNICATION,
      [NOTIFICATION_TYPES.LEAVE_REQUEST]: NOTIFICATION_CATEGORIES.ADMINISTRATIVE,
      [NOTIFICATION_TYPES.TIMESHEET_SUBMISSION]: NOTIFICATION_CATEGORIES.ADMINISTRATIVE,
      [NOTIFICATION_TYPES.TASK_CREATED]: NOTIFICATION_CATEGORIES.TASK,
      [NOTIFICATION_TYPES.TASK_UPDATED]: NOTIFICATION_CATEGORIES.TASK,
      [NOTIFICATION_TYPES.TASK_ASSIGNED]: NOTIFICATION_CATEGORIES.TASK,
      [NOTIFICATION_TYPES.TASK_COMMENT]: NOTIFICATION_CATEGORIES.TASK,
      [NOTIFICATION_TYPES.TASK_STATUS_CHANGE]: NOTIFICATION_CATEGORIES.TASK,
      // Treat project and sprint updates as task-related per UX requirement
      [NOTIFICATION_TYPES.PROJECT_UPDATE]: NOTIFICATION_CATEGORIES.TASK,
      [NOTIFICATION_TYPES.SPRINT_UPDATE]: NOTIFICATION_CATEGORIES.TASK,
      [NOTIFICATION_TYPES.SYSTEM_ALERT]: NOTIFICATION_CATEGORIES.SYSTEM,
      [NOTIFICATION_TYPES.MEETING]: NOTIFICATION_CATEGORIES.COMMUNICATION,
      [NOTIFICATION_TYPES.ACHIEVEMENT]: NOTIFICATION_CATEGORIES.ACHIEVEMENT,
      [NOTIFICATION_TYPES.URGENT]: NOTIFICATION_CATEGORIES.SYSTEM,
      [NOTIFICATION_TYPES.TEAM_COMMUNICATION]: NOTIFICATION_CATEGORIES.COMMUNICATION
    };
    return categoryMap[type] || NOTIFICATION_CATEGORIES.SYSTEM;
  }

  // Check if notification is relevant to current user
  isNotificationRelevant(notification, currentUser) {
    // If notification has specific recipients, check if current user is included
    if (notification.recipients) {
      const { teams = [], users = [], all = false } = notification.recipients;

      // If sent to all users
      if (all) return true;

      // Check if user is explicitly included
      if (users.includes(currentUser.id)) return true;

      // Check if user's team is included
      if (currentUser.team_id && teams.includes(currentUser.team_id)) return true;

      return false;
    }

    // For announcements and system alerts, check based on scope
    if (notification.type === NOTIFICATION_TYPES.ANNOUNCEMENT ||
      notification.type === NOTIFICATION_TYPES.SYSTEM_ALERT) {
      // If no specific recipients, assume it's for everyone
      return true;
    }

    // For task-related notifications, check if user is involved
    if (notification.type.startsWith('task_') ||
      notification.type === NOTIFICATION_TYPES.PROJECT_UPDATE ||
      notification.type === NOTIFICATION_TYPES.SPRINT_UPDATE) {
      // Check if user is assignee, creator, or involved in the project
      return notification.assignee_id === currentUser.id ||
        notification.creator_id === currentUser.id ||
        (notification.project_team_id === currentUser.team_id);
    }

    // Default to relevant for unknown notification types
    return true;
  }

  // Helper to detect announcement type if not explicitly set
  detectAnnouncementType(announcement) {
    if (announcement.task_id) return NOTIFICATION_TYPES.TASK_UPDATED; // Or specific task type
    if (announcement.priority === NOTIFICATION_PRIORITIES.URGENT) return NOTIFICATION_TYPES.URGENT;
    // Add more heuristics if needed
    return NOTIFICATION_TYPES.ANNOUNCEMENT;
  }

  // Fetch all notifications for a user (using announcements table + reads + leave requests + timesheets)
  async fetchNotifications(userId, userRole, teamId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        category = 'all',
        priority = 'all',
        search = ''
      } = options;

      let allNotifications = [];

      // 1. Fetch announcements with read status
      const today = new Date().toISOString();
      let query = supabase
        .from('announcements')
        .select(`
          *,
          announcement_reads!left (
            read,
            read_at,
            user_id
          ),
          created_by_user:created_by (id, name, avatar_url)
        `)
        .gte('expiry_date', today)
        .order('created_at', { ascending: false });

      // Apply Team Filter (Global or Team specific)
      if (teamId) {
        query = query.or(`team_id.eq.${teamId},team_id.is.null`);
      } else {
        query = query.is('team_id', null);
      }

      // Execute query for announcements
      const { data: announcements, error } = await query;
      if (error) throw error;

      // Transform announcements
      const announcementNotifications = announcements.map(announcement => {
        const notifType = announcement.notification_type || this.detectAnnouncementType(announcement);

        // Find read status for THIS user
        const isRead = Array.isArray(announcement.announcement_reads)
          ? announcement.announcement_reads.some(r => r.user_id === userId && r.read)
          : false; // If not array, it likely didn't join correctly or no reads

        return {
          id: `announcement-${announcement.id}`, // Consistent ID format
          type: notifType,
          category: this.getNotificationCategory(notifType),
          title: announcement.title,
          message: announcement.content,
          created_at: announcement.created_at,
          read: isRead,
          priority: announcement.priority || NOTIFICATION_PRIORITIES.NORMAL,
          data: announcement.metadata || { ...announcement, id: announcement.id }, // Ensure ID is in data for actions
          task_id: announcement.task_id,
          sender: announcement.created_by_user
        };
      });
      allNotifications = [...announcementNotifications];

      // 2. Fetch pending leave requests (for managers and admins)
      if (userRole === 'manager' || userRole === 'admin') {
        const { data: leaveRequests, error: leaveError } = await supabase
          .from('leave_plans')
          .select(`
            id, start_date, end_date, status, created_at,
            users:user_id (id, name, teams:team_id(id, name))
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (!leaveError && leaveRequests) {
          const leaveNotifications = leaveRequests.map(request => {
            const startDate = parseISO(request.start_date);
            const endDate = parseISO(request.end_date);
            const days = differenceInDays(endDate, startDate) + 1;
            const notifType = NOTIFICATION_TYPES.LEAVE_REQUEST;

            return {
              id: `leave-${request.id}`,
              type: notifType,
              category: this.getNotificationCategory(notifType),
              title: 'Leave Request',
              message: `${request.users.name} requested ${days} ${days === 1 ? 'day' : 'days'} off (${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')})`,
              created_at: request.created_at,
              read: false, // Always unread until acted upon
              priority: NOTIFICATION_PRIORITIES.NORMAL,
              data: request
            };
          });
          allNotifications = [...allNotifications, ...leaveNotifications];
        }
      }

      // 3. Fetch timesheet submissions (for managers and admins)
      if (userRole === 'manager' || userRole === 'admin') {
        const { data: timesheetSubs, error: tsError } = await supabase
          .from('timesheet_submissions')
          .select(`
            id, user_id, start_date, end_date, status, created_at,
            users:user_id ( id, name, teams:team_id ( id, name ) )
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (!tsError && timesheetSubs) {
          const tsNotifications = timesheetSubs.map(sub => {
            const notifType = NOTIFICATION_TYPES.TIMESHEET_SUBMISSION;
            return {
              id: `timesheet-${sub.id}`,
              type: notifType,
              category: this.getNotificationCategory(notifType),
              title: 'Timesheet Submission',
              message: `${sub.users?.name || 'Employee'} submitted timesheet for ${new Date(sub.start_date).toLocaleDateString()} - ${new Date(sub.end_date).toLocaleDateString()}`,
              created_at: sub.created_at || sub.start_date,
              read: false,
              priority: NOTIFICATION_PRIORITIES.NORMAL,
              data: sub
            };
          });
          allNotifications = [...allNotifications, ...tsNotifications];
        }
      }

      // Sort combined notifications by date (newest first)
      allNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Apply Filters in Memory
      if (category !== 'all') {
        allNotifications = allNotifications.filter(n => n.category === category);
      }

      if (priority !== 'all') {
        allNotifications = allNotifications.filter(n => n.priority === priority);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        allNotifications = allNotifications.filter(n =>
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower)
        );
      }

      const total = allNotifications.length;
      const paginated = allNotifications.slice(offset, offset + limit);

      return {
        notifications: paginated,
        total: total,
        hasMore: offset + limit < total
      };

    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], total: 0, hasMore: false };
    }
  }

  // Mark notification as read
  async markAsRead(announcementId, userId) {
    try {
      if (!userId || !announcementId) return false;

      // Check if already exists
      const { data: existing } = await supabase
        .from('announcement_reads')
        .select('id')
        .eq('announcement_id', announcementId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('announcement_reads')
          .update({
            read: true,
            read_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('announcement_reads')
          .insert({
            announcement_id: announcementId,
            user_id: userId,
            read: true,
            read_at: new Date().toISOString()
          });
        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Helper to create a notification (announcement)
  async createNotification(data) {
    try {
      const {
        title,
        content,
        type = 'general',
        priority = 'Medium',
        teamId,
        companyId,
        userId, // creator
        taskId,
        metadata = {},
        expiryDays = 30
      } = data;

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const { error } = await supabase
        .from('announcements')
        .insert({
          title,
          content,
          notification_type: type,
          priority,
          team_id: teamId,
          company_id: companyId,
          created_by: userId,
          task_id: taskId,
          metadata,
          expiry_date: expiryDate.toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  // Legacy/Compatibility methods mapped to new implementation
  async fetchTaskNotifications(userId, userRole, teamId, limit = 10) {
    // Just fetch all and filter for tasks
    const result = await this.fetchNotifications(userId, userRole, teamId, { limit, category: 'task' });
    return result.notifications;
  }

  async createTaskNotification(taskId, type, userId, data = {}) {
    // Map to createNotification
    return this.createNotification({
      title: data.title || 'Task Update',
      content: data.message || 'You have a task update',
      type: type, // e.g., 'task_assigned'
      priority: data.priority || 'Medium',
      userId: userId, // Creator
      taskId: taskId,
      metadata: { ...data, taskId }
      // Note: We might need team_id here if we want it to be visible to the team
    });
  }


  // Set up real-time subscription for notifications
  subscribeToNotifications(userId, userRole, teamId, callback) {
    const subscriptionKey = `notifications_${userId}`;

    // Remove existing subscription if any
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey).unsubscribe();
    }

    // Create new subscription
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leave_plans'
        },
        () => callback('leave_request')
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements'
        },
        () => callback('announcement')
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'timesheet_submissions'
        },
        () => callback('timesheet_submission')
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, channel);

    return subscriptionKey;
  }

  // Unsubscribe from notifications
  unsubscribeFromNotifications(subscriptionKey) {
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey).unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Public API expected by hooks/components: wrap fetchNotifications with pagination
  async getNotifications(params = {}) {
    try {
      const {
        userId,
        role,
        teamId,
        limit = 50,
        page = 1,
        ...rest
      } = params;
      const offset = Math.max(0, (page - 1) * limit);

      const { notifications, total, unreadCount } = await this.fetchNotifications(
        userId,
        role,
        teamId,
        { limit, offset, ...rest }
      );

      const hasMore = offset + notifications.length < total;
      return { notifications, total, unreadCount, hasMore };
    } catch (error) {
      console.error('Error in getNotifications:', error);
      throw error;
    }
  }

  // Get notification statistics with advanced analytics
  async getNotificationStats(userId, userRole, teamId) {
    try {
      const { notifications, total, unreadCount } = await this.fetchNotifications(
        userId, userRole, teamId, { limit: 1000 }
      );

      const stats = {
        total,
        unread: unreadCount,
        byType: {},
        byCategory: {},
        byPriority: {},
        responseTime: this.calculateAverageResponseTime(notifications),
        engagementRate: this.calculateEngagementRate(notifications),
        dailyActivity: this.getDailyActivity(notifications),
        topCategories: this.getTopCategories(notifications)
      };

      // Calculate statistics
      notifications.forEach(notification => {
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        const category = this.getNotificationCategory(notification.type);
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { total: 0, unread: 0, byType: {}, byCategory: {}, byPriority: {} };
    }
  }

  // Advanced analytics methods
  calculateAverageResponseTime(notifications) {
    const responded = notifications.filter(n => n.read && n.created_at && n.read_at);
    if (responded.length === 0) return 0;

    const totalTime = responded.reduce((sum, n) => {
      const created = new Date(n.created_at);
      const read = new Date(n.read_at);
      return sum + (read - created);
    }, 0);

    return Math.round(totalTime / responded.length / 1000 / 60); // minutes
  }

  calculateEngagementRate(notifications) {
    if (notifications.length === 0) return 0;
    const engaged = notifications.filter(n => n.read || n.reactions?.length > 0 || n.comments?.length > 0);
    return Math.round((engaged.length / notifications.length) * 100);
  }

  getDailyActivity(notifications) {
    const last7Days = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days[dateStr] = 0;
    }

    notifications.forEach(n => {
      const dateStr = new Date(n.created_at).toISOString().split('T')[0];
      if (Object.prototype.hasOwnProperty.call(last7Days, dateStr)) {
        last7Days[dateStr]++;
      }
    });

    return Object.entries(last7Days).map(([date, count]) => ({ date, count }));
  }

  getTopCategories(notifications) {
    const categories = {};
    notifications.forEach(n => {
      const category = this.getNotificationCategory(n.type);
      categories[category] = (categories[category] || 0) + 1;
    });

    return Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  }

  // Add missing methods for NotificationCreator

  async bookmarkNotification(notificationId) {
    try {
      // This would require a bookmarks table - for now, just return success
      console.log('Bookmarking notification:', notificationId);
      return { isBookmarked: true };
    } catch (error) {
      console.error('Error bookmarking notification:', error);
      return { isBookmarked: false };
    }
  }

  // Create notification with advanced features
  async createAdvancedNotification(data) {
    try {
      // For now, create an announcement since that's what we have table support for
      if (data.recipients && data.recipients.all && data.recipients.all.some(r => r.id === 'everyone')) {
        // Create announcements for all teams (so team-based RLS allows reading)
        const { data: teams } = await supabase
          .from('teams')
          .select('id');
        const teamIds = (teams || []).map(t => t.id);
        for (const _tid of teamIds) {
          const { error } = await supabase
            .from('announcements')
            .insert({
              title: data.title,
              content: data.message,
              created_by: data.createdBy,
              team_id: tid,
              expiry_date: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
              created_at: new Date().toISOString()
            });
          if (error) throw error;
        }
      } else if (data.recipients && data.recipients.teams) {
        // Create announcements for specific teams
        for (const _team of data.recipients.teams) {
          const { error } = await supabase
            .from('announcements')
            .insert({
              title: data.title,
              content: data.message,
              created_by: data.createdBy,
              team_id: team.id,
              expiry_date: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            });

          if (error) throw error;
        }
      } else {
        // Default to creating an announcement for the creator's team
        const { data: userData } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', data.createdBy)
          .single();

        const { error } = await supabase
          .from('announcements')
          .insert({
            title: data.title,
            content: data.message,
            created_by: data.createdBy,
            team_id: userData?.team_id,
            expiry_date: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      const notification = {
        id: crypto.randomUUID(),
        title: data.title,
        message: data.message,
        category: data.category || NOTIFICATION_CATEGORIES.COMMUNICATION,
        type: data.type || NOTIFICATION_TYPES.ANNOUNCEMENT,
        priority: data.priority || NOTIFICATION_PRIORITIES.NORMAL,
        created_by: data.createdBy,
        created_at: new Date().toISOString()
      };

      return notification;
    } catch (error) {
      console.error('Error creating advanced notification:', error);
      throw error;
    }
  }

  // Get notification templates
  async getTemplates(category = null) {
    try {
      let query = supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  // User preferences management
  async getUserPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Convert to map for easier access
      const preferences = {};
      (data || []).forEach(pref => {
        preferences[pref.category] = pref;
      });

      return preferences;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return {};
    }
  }

  async updateUserPreferences(userId, category, preferences) {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          category,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  // Create a new notification (announcement)
  async createNotification(notificationData) {
    try {
      // Map notification data to announcement schema
      const announcementData = {
        title: notificationData.title,
        content: notificationData.message,
        notification_type: notificationData.type || NOTIFICATION_TYPES.ANNOUNCEMENT,
        priority: notificationData.priority || NOTIFICATION_PRIORITIES.NORMAL,
        team_id: notificationData.recipients?.teams?.[0] || null,
        created_by: notificationData.sender_id,
        company_id: notificationData.company_id || notificationData.teamId,
        task_id: notificationData.task_id || null,
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        metadata: {
          recipients: notificationData.recipients,
          sender_name: notificationData.sender_name
        }
      };

      const { data, error } = await supabase
        .from('announcements')
        .insert(announcementData)
        .select(`
          id,
          title,
          content,
          notification_type,
          priority,
          created_at,
          updated_at,
          expiry_date,
          team_id,
          created_by,
          task_id,
          company_id,
          metadata
        `)
        .single();

      if (error) throw error;

      // Transform to notification format
      return {
        id: data.id,
        title: data.title,
        message: data.content,
        type: data.notification_type,
        priority: data.priority,
        created_at: data.created_at,
        updated_at: data.updated_at,
        read: false,
        team_id: data.team_id,
        task_id: data.task_id,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Handle leave request action (approve/reject)
  async handleLeaveAction(leaveId, action) {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      const { error } = await supabase
        .from('leave_plans')
        .update({ status: status })
        .eq('id', leaveId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error handling leave request ${action}:`, error);
      return false;
    }
  }

  // Archive notification (delete announcement)
  async archiveNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  // Delete notification permanently (delete announcement)
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

export default new NotificationService();