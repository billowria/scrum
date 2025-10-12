import { supabase } from '../supabaseClient';
import notificationService, { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../services/notificationService';

/**
 * Creates a task update notification for a user
 * @param {string} userId - The ID of the user to notify
 * @param {string} taskId - The ID of the task that was updated
 * @param {string} taskTitle - The title of the task
 * @param {string} action - The action performed (assigned, updated, completed, etc.)
 * @param {string} message - Additional message about the update
 * @param {Object} additionalData - Any additional data to store with the notification
 */
export const createTaskNotification = async (userId, taskId, taskTitle, action, message, additionalData = {}) => {
  try {
    const type = action === 'assigned' || action === 'reassigned' ? NOTIFICATION_TYPES.TASK_ASSIGNED :
                 action === 'comment' ? NOTIFICATION_TYPES.TASK_COMMENT :
                 NOTIFICATION_TYPES.TASK_UPDATED;
    
    await notificationService.createTaskNotification(taskId, type, userId, {
      title: titleFromAction(action, taskTitle),
      message,
      ...additionalData
    });
    
    return { userId, taskId, taskTitle, action, message };
  } catch (error) {
    console.error('Error creating task notification:', error);
    throw error;
  }
};

function titleFromAction(action, taskTitle) {
  switch (action) {
    case 'assigned': return 'New Task Assigned';
    case 'reassigned': return 'Task Reassigned';
    case 'status_changed': return 'Task Status Updated';
    case 'comment': return 'New Comment on Task';
    default: return 'Task Updated';
  }
}

/**
 * Creates multiple task notifications for a list of users
 * @param {Array} userIds - Array of user IDs to notify
 * @param {string} taskId - The ID of the task that was updated
 * @param {string} taskTitle - The title of the task
 * @param {string} action - The action performed
 * @param {string} message - Additional message about the update
 * @param {Object} additionalData - Any additional data to store with the notification
 */
export const createTaskNotificationsForUsers = async (userIds, taskId, taskTitle, action, message, additionalData = {}) => {
  try {
    const notifications = [];
    
    for (const userId of userIds) {
      const notification = await createTaskNotification(userId, taskId, taskTitle, action, message, additionalData);
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error creating task notifications for users:', error);
    throw error;
  }
};

/**
 * Create notification for leave request (for managers)
 */
export const notifyLeaveRequest = async (leaveRequest, requesterName, managerId) => {
  try {
    // Create announcement for the manager about new leave request
    const { data: { user } } = await supabase.auth.getUser();
    const creatorId = user?.id || leaveRequest.user_id;

    await supabase.from('announcements').insert({
      title: 'New Leave Request',
      content: `${requesterName} has requested leave from ${new Date(leaveRequest.start_date).toLocaleDateString()} to ${new Date(leaveRequest.end_date).toLocaleDateString()}.`,
      created_by: creatorId,
      team_id: null, // Visible to all
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error creating leave request notification:', error);
  }
};

/**
 * Notify user about leave request status change
 */
export const notifyLeaveStatus = async (leaveRequest, status, userId) => {
  try {
    const { data: userData } = await supabase.from('users').select('team_id').eq('id', userId).single();
    
    await supabase.from('announcements').insert({
      title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      content: `Your leave request for ${new Date(leaveRequest.start_date).toLocaleDateString()} to ${new Date(leaveRequest.end_date).toLocaleDateString()} has been ${status}.`,
      created_by: userId,
      team_id: userData?.team_id,
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error creating leave status notification:', error);
  }
};

/**
 * Notify user about achievement
 */
export const notifyAchievement = async (userId, achievementTitle, creatorName) => {
  try {
    const { data: userData } = await supabase.from('users').select('team_id').eq('id', userId).single();
    
    await supabase.from('announcements').insert({
      title: '🏆 New Achievement!',
      content: `Congratulations! You've earned the achievement: ${achievementTitle}`,
      created_by: userId,
      team_id: userData?.team_id,
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error creating achievement notification:', error);
  }
};

/**
 * Notify team about project update
 */
export const notifyProjectUpdate = async (projectName, message, teamId, creatorId) => {
  try {
    await supabase.from('announcements').insert({
      title: `Project Update: ${projectName}`,
      content: message,
      created_by: creatorId,
      team_id: teamId,
      expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error creating project update notification:', error);
  }
};

/**
 * Notify team about sprint changes
 */
export const notifySprintUpdate = async (sprintName, action, teamId, creatorId) => {
  try {
    const actionText = action === 'started' ? 'has started' : 
                       action === 'completed' ? 'has been completed' : 
                       'has been created';
    
    await supabase.from('announcements').insert({
      title: `Sprint ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      content: `Sprint "${sprintName}" ${actionText}.`,
      created_by: creatorId,
      team_id: teamId,
      expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error creating sprint notification:', error);
  }
};

/**
 * Notify manager about timesheet submission
 */
export const notifyTimesheetSubmission = async (submitterName, startDate, endDate, managerId) => {
  try {
    const { data: managerData } = await supabase.from('users').select('team_id').eq('id', managerId).single();
    
    await supabase.from('announcements').insert({
      title: 'Timesheet Submitted',
      content: `${submitterName} has submitted a timesheet for ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}.`,
      created_by: managerId,
      team_id: managerData?.team_id,
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error creating timesheet notification:', error);
  }
};

/**
 * Notify user about timesheet status
 */
export const notifyTimesheetStatus = async (status, startDate, endDate, userId) => {
  try {
    const { data: userData } = await supabase.from('users').select('team_id').eq('id', userId).single();
    
    await supabase.from('announcements').insert({
      title: `Timesheet ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      content: `Your timesheet for ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()} has been ${status}.`,
      created_by: userId,
      team_id: userData?.team_id,
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error creating timesheet status notification:', error);
  }
};
