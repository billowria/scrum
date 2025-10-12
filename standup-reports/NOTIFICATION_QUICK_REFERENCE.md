# Notification System - Quick Reference Guide

## 🎯 At a Glance

Your notification system is **fully integrated** across all major features. Here's what's working:

| Feature | Trigger | Who Gets Notified | Status |
|---------|---------|-------------------|--------|
| **Task Assignment** | Task created/assigned | Assignee | ✅ Working |
| **Task Status Change** | Status updated | Assignee | ✅ Working |
| **Leave Request** | Submitted | Manager | ✅ Working |
| **Leave Decision** | Approved/Rejected | Employee | ✅ Working |
| **Achievement** | Awarded | Recipient | ✅ Working |
| **Project Created** | New project | Team Members | ✅ Working |
| **Project Updated** | Project changed | Team Members | ✅ Working |
| **Sprint Created** | New sprint | Team Members | ✅ Working |
| **Sprint Started** | Sprint activated | Team Members | ✅ Working |
| **Sprint Completed** | Sprint finished | Team Members | ✅ Working |
| **Timesheet Decision** | Approved/Rejected | Employee | ✅ Working |

---

## 🔥 Common Use Cases

### Notify a User About a Task
```javascript
import { createTaskNotification } from '../utils/notificationHelper';

await createTaskNotification(
  userId,           // Who to notify
  taskId,          // Task ID
  taskTitle,       // Task title
  'assigned',      // Action: 'assigned', 'reassigned', 'status_changed', 'comment'
  message,         // Message text
  { ...extraData } // Optional additional data
);
```

### Notify About Leave Request
```javascript
import { notifyLeaveRequest, notifyLeaveStatus } from '../utils/notificationHelper';

// When submitted:
await notifyLeaveRequest(leaveRequest, requesterName, managerId);

// When approved/rejected:
await notifyLeaveStatus(leaveRequest, 'approved', userId); // or 'rejected'
```

### Notify About Achievement
```javascript
import { notifyAchievement } from '../utils/notificationHelper';

await notifyAchievement(userId, achievementTitle, creatorName);
```

### Notify About Project/Sprint
```javascript
import { notifyProjectUpdate, notifySprintUpdate } from '../utils/notificationHelper';

// Project:
await notifyProjectUpdate(projectName, message, teamId, creatorId);

// Sprint:
await notifySprintUpdate(sprintName, action, teamId, creatorId);
// action can be: 'created', 'started', 'completed'
```

### Notify About Timesheet
```javascript
import { notifyTimesheetStatus } from '../utils/notificationHelper';

await notifyTimesheetStatus(status, startDate, endDate, userId);
// status can be: 'approved', 'rejected'
```

---

## 🛠️ Integration Pattern

**Always use this pattern when adding notifications:**

```javascript
try {
  // Your main operation (create task, update status, etc.)
  await mainOperation();
  
  // Send notification (non-blocking)
  try {
    await notificationHelper(...);
  } catch (notificationError) {
    console.error('Notification failed:', notificationError);
    // Don't throw - continue with main flow
  }
  
} catch (error) {
  // Handle main operation error
  console.error('Operation failed:', error);
  throw error;
}
```

**Key Points:**
- ✅ Wrap notification in its own try-catch
- ✅ Don't let notification failures break main operation
- ✅ Log notification errors for debugging
- ✅ Main operation always completes first

---

## 📱 Where Notifications Appear

### 1. Notification Center (`/notifications`)
- All notifications visible here
- Can mark as read/unread
- Can delete notifications
- Real-time updates
- Filter by type and status

### 2. Header Bell Icon
- Shows unread count
- Quick dropdown preview
- Click to go to full Notification Center

### 3. Real-time Toasts (if implemented)
- Pop-up notifications for immediate actions
- Auto-dismiss after a few seconds

---

## 🗂️ Notification Storage

### Two Types:

#### 1. Task Notifications (`notifications` table)
- Used for: Task assignments, status changes, comments
- Stored in: Supabase `notifications` table
- Features: Priority levels, read status, structured data

#### 2. General Announcements (`announcements` table)
- Used for: Leave, achievements, projects, sprints, timesheets
- Stored in: Supabase `announcements` table
- Features: Team visibility, expiry dates, organization-wide reach

---

## ⏱️ Notification Expiry

| Type | Expires After |
|------|---------------|
| Leave Requests | 7 days |
| Timesheet Updates | 7 days |
| Project Updates | 14 days |
| Sprint Updates | 14 days |
| Achievements | 30 days |
| Task Updates | Never (managed by read status) |

---

## 🎨 Customization Examples

### Custom Notification with Rich Content
```javascript
await supabase.from('announcements').insert({
  title: '🎉 Team Milestone',
  content: 'We hit 100 completed tasks this month!',
  created_by: currentUserId,
  team_id: teamId,
  expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
});
```

### Organization-Wide Announcement
```javascript
await supabase.from('announcements').insert({
  title: '📢 Company Update',
  content: 'Important company-wide announcement...',
  created_by: adminId,
  team_id: null, // null = visible to everyone
  expiry_date: futureDate.toISOString()
});
```

---

## 🔍 Troubleshooting

### Notification Not Appearing?

**Check:**
1. Is the user authenticated?
2. Does the user have the correct team_id?
3. Is the notification expired?
4. Check browser console for errors
5. Verify Supabase connection

### Common Issues:

**"User not found"**
- Verify user_id exists in users table
- Check manager_id is set for employees

**"Team not found"**
- Verify team_id exists in teams table
- Check user's team assignment

**"Notification created but not visible"**
- Check team_id filter in notification query
- Verify expiry_date is in the future
- Check real-time subscription is active

---

## 📊 Monitoring & Analytics

### Check Notification Stats
```javascript
// Unread count
const { count } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('read', false);

// Recent announcements
const { data } = await supabase
  .from('announcements')
  .select('*')
  .gte('expiry_date', new Date().toISOString())
  .order('created_at', { ascending: false })
  .limit(10);
```

---

## 🚀 Next Steps

### Ready to Implement:
1. **Email Notifications** - Send important notifications via email
2. **Push Notifications** - Browser push for urgent updates
3. **Notification Preferences** - Let users customize what they receive
4. **Batch Notifications** - Daily digest of updates

### Enhancement Ideas:
- Add notification sound
- Add notification priority indicators
- Group related notifications
- Add notification templates
- Implement notification scheduling

---

## 📞 Need Help?

**Common Questions:**

**Q: How do I test notifications?**
A: Use the test checklist in `NOTIFICATION_INTEGRATION_SUMMARY.md`

**Q: Can I send notifications to multiple users?**
A: Yes! Use team_id for team notifications or loop through user IDs

**Q: How do I create urgent notifications?**
A: Use notificationService with PRIORITY.HIGH for task notifications

**Q: Can I customize notification appearance?**
A: Yes! Edit the NotificationCenter component UI

---

## 📚 Full Documentation

For complete details, see: `NOTIFICATION_INTEGRATION_SUMMARY.md`

---

**Quick Links:**
- Notification Service: `src/services/notificationService.js`
- Helper Functions: `src/utils/notificationHelper.js`
- Notification Center: `src/pages/NotificationCenterV2.jsx`
- Creator Modal: `src/components/notifications/NotificationCreator.jsx`
