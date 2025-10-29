import { supabase } from '../supabaseClient';
import { format, parseISO, differenceInDays } from 'date-fns';

// Notification types enum (based on announcement notification_type)
export const NOTIFICATION_TYPES = {
  ANNOUNCEMENT: 'general',
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

  // Fetch all notifications for a user (using announcements table + other sources)
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

      // 1. Fetch announcements (general notifications)
      const announcementNotifications = await this.fetchAnnouncementNotifications(userId, teamId, limit);
      allNotifications = allNotifications.concat(announcementNotifications);

      // 2. Fetch leave request notifications (only for managers and admins)
      if (userRole === 'manager' || userRole === 'admin') {
        const leaveNotifications = await this.fetchLeaveRequestNotifications(teamId, Math.floor(limit / 3));
        allNotifications = allNotifications.concat(leaveNotifications);
      }

      // 3. Fetch timesheet notifications (only for managers and admins)
      if (userRole === 'manager' || userRole === 'admin') {
        const timesheetNotifications = await this.fetchTimesheetNotifications(teamId, Math.floor(limit / 3));
        allNotifications = allNotifications.concat(timesheetNotifications);
      }

      // 4. Fetch task notifications for all users
      const taskNotifications = await this.fetchTaskNotifications(userId, userRole, teamId, Math.floor(limit / 3));
      allNotifications = allNotifications.concat(taskNotifications);

      // Sort by created_at date (most recent first)
      allNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Apply pagination
      const paginatedNotifications = allNotifications.slice(offset, offset + limit);

      // Apply additional filters
      let filteredNotifications = paginatedNotifications;

      if (category !== 'all') {
        filteredNotifications = filteredNotifications.filter(notification =>
          this.getNotificationCategory(notification.type) === category
        );
      }

      if (priority !== 'all') {
        filteredNotifications = filteredNotifications.filter(notification =>
          notification.priority === priority
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredNotifications = filteredNotifications.filter(notification =>
          notification.title.toLowerCase().includes(searchLower) ||
          notification.message.toLowerCase().includes(searchLower)
        );
      }

      return {
        notifications: filteredNotifications,
        total: allNotifications.length,
        hasMore: offset + filteredNotifications.length < allNotifications.length
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Return empty result if table doesn't exist
      return {
        notifications: [],
        total: 0,
        hasMore: false
      };
    }
  }

  // Main method used by components (legacy - keeping for compatibility)
  async getNotificationsLegacy(options = {}) {
    return this.fetchNotifications(options.userId, options.role, options.teamId, options);
  }

  // Fetch leave request notifications
  async fetchLeaveRequestNotifications(teamId, limit = 10) {
    try {
      const { data: leaveRequests, error } = await supabase
        .from('leave_plans')
        .select(`
          id, start_date, end_date, status, created_at, reason,
          users:user_id (id, name, teams:team_id(id, name))
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return leaveRequests.map(request => {
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
          read: false,
          priority: NOTIFICATION_PRIORITIES.NORMAL,
          data: request,
          actions: ['approve', 'reject', 'view']
        };
      });
    } catch (error) {
      console.error('Error fetching leave request notifications:', error);
      return [];
    }
  }

  // Create a leave request notification
  async createLeaveRequestNotification(leaveRequestId) {
    try {
      // Fetch the leave request details
      const { data: leaveRequest, error } = await supabase
        .from('leave_plans')
        .select(`
          id, start_date, end_date, status, created_at, reason, user_id,
          users:user_id (id, name, teams:team_id(id, name))
        `)
        .eq('id', leaveRequestId)
        .single();

      if (error) throw error;

      // Get the team to notify managers
      const { data: team } = await supabase
        .from('teams')
        .select('id, company_id')
        .eq('id', leaveRequest.users.teams?.id)
        .single();

      if (!team) {
        console.error('Team not found for leave request');
        return false;
      }

      const startDate = parseISO(leaveRequest.start_date);
      const endDate = parseISO(leaveRequest.end_date);
      const days = differenceInDays(endDate, startDate) + 1;

      // Create announcement for managers
      const announcementData = {
        title: 'Leave Request',
        content: `${leaveRequest.users.name} requested ${days} ${days === 1 ? 'day' : 'days'} off (${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')})${leaveRequest.reason ? ` - Reason: ${leaveRequest.reason}` : ''}`,
        notification_type: NOTIFICATION_TYPES.LEAVE_REQUEST,
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        team_id: team.id,
        company_id: team.company_id,
        created_by: leaveRequest.user_id,
        metadata: {
          leave_request_id: leaveRequestId,
          user_id: leaveRequest.user_id,
          start_date: leaveRequest.start_date,
          end_date: leaveRequest.end_date,
          days: days
        }
      };

      const { error: insertError } = await supabase
        .from('announcements')
        .insert(announcementData);

      if (insertError) throw insertError;

      return true;
    } catch (error) {
      console.error('Error creating leave request notification:', error);
      return false;
    }
  }

  // Update leave request notification when status changes
  async updateLeaveRequestNotification(leaveRequestId, newStatus) {
    try {
      // Find the related announcement
      const { data: announcements, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('metadata->>leave_request_id', leaveRequestId.toString());

      if (error) throw error;

      if (announcements && announcements.length > 0) {
        // Update or delete the announcement based on status
        if (newStatus === 'approved' || newStatus === 'rejected') {
          // Mark as processed by updating the notification_type
          const { error: updateError } = await supabase
            .from('announcements')
            .update({
              notification_type: `leave_request_${newStatus}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', announcements[0].id);

          if (updateError) throw updateError;
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating leave request notification:', error);
      return false;
    }
  }

  // Approve leave request from notification
  async approveLeaveRequestFromNotification(leaveRequestId, managerId) {
    try {
      const { error } = await supabase
        .from('leave_plans')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
          approved_by: managerId
        })
        .eq('id', leaveRequestId);

      if (error) throw error;

      // Update the notification
      await this.updateLeaveRequestNotification(leaveRequestId, 'approved');

      return true;
    } catch (error) {
      console.error('Error approving leave request from notification:', error);
      return false;
    }
  }

  // Reject leave request from notification
  async rejectLeaveRequestFromNotification(leaveRequestId, managerId, rejectionReason = '') {
    try {
      const { error } = await supabase
        .from('leave_plans')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
          approved_by: managerId,
          rejection_reason: rejectionReason
        })
        .eq('id', leaveRequestId);

      if (error) throw error;

      // Update the notification
      await this.updateLeaveRequestNotification(leaveRequestId, 'rejected');

      return true;
    } catch (error) {
      console.error('Error rejecting leave request from notification:', error);
      return false;
    }
  }

  // Fetch timesheet notifications
  async fetchTimesheetNotifications(teamId, limit = 10) {
    try {
      const { data: timesheetSubs, error } = await supabase
        .from('timesheet_submissions')
        .select(`
          id, user_id, start_date, end_date, status, created_at,
          users:user_id (id, name, teams:team_id(id, name))
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (timesheetSubs || []).map(sub => {
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
          data: sub,
          actions: ['approve', 'reject', 'view']
        };
      });
    } catch (error) {
      console.error('Error fetching timesheet notifications:', error);
      return [];
    }
  }

  // Infer a more specific type for announcements to improve categorization
  detectAnnouncementType(announcement) {
    const title = (announcement.title || '').toLowerCase();
    const content = (announcement.content || '').toLowerCase();
    const notificationType = announcement.notification_type;

    // Debug logging for categorization
    console.log('Detecting announcement type:', {
      title: announcement.title,
      content: announcement.content?.substring(0, 100) + '...',
      notificationType,
      metadata: announcement.metadata
    });

    // If notification_type is explicitly set, use it
    if (notificationType) {
      // Validate that it's a known notification type
      if (Object.values(NOTIFICATION_TYPES).includes(notificationType)) {
        console.log('Using explicit notification type:', notificationType);
        return notificationType;
      }
    }

    // Sprint-related announcements - enhanced detection
    if (title.startsWith('sprint ') ||
        title.includes('sprint update') ||
        title.includes('sprint started') ||
        title.includes('sprint completed') ||
        title.includes('sprint created') ||
        (content.includes('sprint') &&
        (content.includes('started') || content.includes('completed') || content.includes('created')))) {
      console.log('Detected sprint update notification');
      return NOTIFICATION_TYPES.SPRINT_UPDATE;
    }

    // Task-related announcements - enhanced detection for tasks page notifications
    if (title.includes('task') ||
        title.includes('new task') ||
        title.includes('task assigned') ||
        title.includes('task updated') ||
        title.includes('task status') ||
        title.includes('comment on task') ||
        title.includes('task created') ||
        title.includes('task completed') ||
        content.includes('task ')) {
      // More specific task type detection
      if (title.includes('assigned') || title.includes('new task') || title.includes('task created')) {
        console.log('Detected task assigned notification');
        return NOTIFICATION_TYPES.TASK_ASSIGNED;
      } else if (title.includes('status') || title.includes('completed') || title.includes('task completed')) {
        console.log('Detected task status change notification');
        return NOTIFICATION_TYPES.TASK_STATUS_CHANGE;
      } else if (title.includes('comment')) {
        console.log('Detected task comment notification');
        return NOTIFICATION_TYPES.TASK_COMMENT;
      } else {
        console.log('Detected task updated notification');
        return NOTIFICATION_TYPES.TASK_UPDATED;
      }
    }

    // Project update announcements - enhanced detection for projects page notifications
    if (title.startsWith('project update') ||
        title.includes('project created') ||
        title.includes('project updated') ||
        title.includes('new project') ||
        title.includes('project milestone') ||
        (content.includes('project') &&
        (content.includes('created') || content.includes('updated') || content.includes('milestone')))) {
      console.log('Detected project update notification');
      return NOTIFICATION_TYPES.PROJECT_UPDATE;
    }

    // Leave request announcements
    if (title.includes('leave request') || content.includes('leave request')) {
      console.log('Detected leave request notification');
      return NOTIFICATION_TYPES.LEAVE_REQUEST;
    }

    // Timesheet announcements
    if (title.includes('timesheet') || content.includes('timesheet')) {
      console.log('Detected timesheet notification');
      return NOTIFICATION_TYPES.TIMESHEET_SUBMISSION;
    }

    // Check metadata for task/project information
    if (announcement.metadata) {
      if (announcement.metadata.taskId || announcement.metadata.taskTitle) {
        console.log('Detected task notification from metadata');
        return NOTIFICATION_TYPES.TASK_UPDATED;
      }
      if (announcement.metadata.projectId || announcement.metadata.projectName) {
        console.log('Detected project notification from metadata');
        return NOTIFICATION_TYPES.PROJECT_UPDATE;
      }
    }

    console.log('Defaulting to general announcement');
    return NOTIFICATION_TYPES.ANNOUNCEMENT;
  }

  // Fetch announcement notifications
  async fetchAnnouncementNotifications(userId, teamId, limit = 10) {
    try {
      // Guard against missing identifiers
      if (!userId || !teamId) {
        return [];
      }

      const today = new Date().toISOString();

      // Get announcements
      const { data: announcements, error } = await supabase
        .from('announcements')
        .select(`
          id, title, content, created_at, expiry_date,
          teams:team_id (id, name),
          manager:created_by (id, name)
        `)
        .gte('expiry_date', today)
        .or(`team_id.eq.${teamId},team_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return announcements.map(announcement => {
          const notifType = this.detectAnnouncementType(announcement);
          return {
            id: `announcement-${announcement.id}`,
            type: notifType,
            category: this.getNotificationCategory(notifType),
            title: announcement.title,
            message: announcement.content.length > 80 
              ? `${announcement.content.substring(0, 80)}...` 
              : announcement.content,
            created_at: announcement.created_at,
            read: false,
            priority: announcement.priority || NOTIFICATION_PRIORITIES.NORMAL,
            data: announcement,
            actions: ['view', 'dismiss']
          };
        });
    } catch (error) {
      console.error('Error fetching announcement notifications:', error);
      return [];
    }
  }

  // Fetch task notifications
  async fetchTaskNotifications(userId, userRole, teamId, limit = 10) {
    try {
      // Check if notifications table exists, if not return empty array
      const { data: taskNotifications, error } = await supabase
        .from('notifications')
        .select(`
          id, type, title, message, data, priority, read, created_at,
          user_id
        `)
        .eq('user_id', userId)
        .in('type', [
          NOTIFICATION_TYPES.TASK_ASSIGNED,
          NOTIFICATION_TYPES.TASK_UPDATED,
          NOTIFICATION_TYPES.TASK_COMMENT
        ])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        // If table doesn't exist, return empty array
        console.log('Notifications table not found or error:', error.message);
        return [];
      }

      return (taskNotifications || []).map(notification => {
        const notifType = notification.type;
        return {
          id: `task-${notification.id}`,
          type: notifType,
          category: this.getNotificationCategory(notifType),
          title: notification.title,
          message: notification.message,
          created_at: notification.created_at,
          read: notification.read || false,
          priority: notification.priority || NOTIFICATION_PRIORITIES.NORMAL,
          data: notification.data || {},
          actions: ['view', 'mark_read']
        };
      });
    } catch (error) {
      console.error('Error fetching task notifications:', error);
      return [];
    }
  }

  // Create a new task notification
  async createTaskNotification(taskId, type, userId, data = {}) {
    try {
      const notificationData = {
        user_id: userId,
        type: type,
        title: data.title || 'Task Update',
        message: data.message || 'You have a task update',
        data: JSON.stringify({ taskId, ...data }),
        priority: data.priority || NOTIFICATION_PRIORITIES.NORMAL,
        read: false,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notifications')
        .insert(notificationData);

      if (error) {
        // If table doesn't exist, just log it
        console.log('Could not create task notification (table may not exist):', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating task notification:', error);
      return false;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      // Resolve user if not provided
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }
      // Parse notification ID to get type and real ID
      const parts = notificationId.split('-');
      const type = parts[0];
      const id = parts[1];

      // Handle different notification types
      switch (type) {
        case 'announcement':
        case 'leave':
        case 'timesheet':
          // These don't have read state tracking - they're either pending or processed
          return true;

        default:
          // For other types, implement read tracking
          console.log(`Marking ${notificationId} as read for user ${userId}`);
          return true;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
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
      .sort(([,a], [,b]) => b - a)
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