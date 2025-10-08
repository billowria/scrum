import { supabase } from '../supabaseClient';

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
    // In a real implementation, you would insert into a notifications table
    // For now, we'll just log it to the console
    console.log('Task notification created:', { userId, taskId, taskTitle, action, message, additionalData });
    
    return { userId, taskId, taskTitle, action, message, additionalData };
  } catch (error) {
    console.error('Error creating task notification:', error);
    throw error;
  }
};

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