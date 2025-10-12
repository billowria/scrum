# Sprint Management - Quick Reference

## 📁 New Files Created

### Core Components
1. **`src/utils/sprintUtils.js`** - Sprint calculation utilities
2. **`src/components/sprint/SprintManagement.jsx`** - Main sprint grid view
3. **`src/components/sprint/SprintDetailView.jsx`** - Sprint detail modal with board
4. **`src/components/sprint/SprintAnalytics.jsx`** - Analytics dashboard with charts

### Modified Files
- **`src/pages/TasksPage.jsx`** - Integrated new sprint system

## 🎯 Key Features at a Glance

| Feature | Description | Access |
|---------|-------------|--------|
| **Sprint Grid** | Visual card grid of all sprints | Sprint view → Main page |
| **Sprint Detail** | Full sprint with kanban board | Click any sprint card |
| **Analytics** | Burndown chart & metrics | Sprint detail → Analytics tab |
| **Health Score** | 0-100 sprint health indicator | Visible on all sprint cards |
| **Drag & Drop** | Move tasks between columns | Sprint detail → Board view |
| **Filter Sprints** | Filter by status | Sprint view → Status tabs |

## 🚀 Quick Actions

### Manager Actions
```
Create Sprint    → Sprint view → "Create Sprint" button
Edit Sprint      → Hover sprint card → "Edit" button
Delete Sprint    → Hover sprint card (Planning only) → Delete icon
Start Sprint     → Hover sprint card (Planning) → "Start" button
Complete Sprint  → Hover sprint card (Active) → "Complete" button
Add Tasks        → Sprint detail → "Add Tasks" button
```

### All Users
```
View Sprint      → Click any sprint card
See Analytics    → Sprint detail → "Analytics" tab
Move Tasks       → Sprint detail → Drag task card to new column
Filter View      → Sprint view → Click status tab
```

## 📊 Sprint Health Colors

| Color | Range | Meaning |
|-------|-------|---------|
| 🟢 Green | 80-100 | Healthy, on track |
| 🟡 Amber | 60-79 | Needs attention |
| 🔴 Red | 0-59 | Critical issues |

## 🎨 Sprint Status Colors

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| **Planning** | 🔵 Blue | 🕒 Clock | Not started yet |
| **Active** | 🟢 Green | 📈 Activity | Currently running |
| **Completed** | ⚪ Gray | ✅ Check | Finished |
| **Overdue** | 🔴 Red | ⚠️ Alert | Past end date |

## 💻 Component Props Reference

### SprintManagement
```jsx
<SprintManagement
  sprints={[]}              // Array of sprint objects
  tasks={[]}                // Array of task objects
  onCreateSprint={fn}       // Handler for create button
  onEditSprint={fn}         // Handler for edit action
  onDeleteSprint={fn}       // Handler for delete action
  onSelectSprint={fn}       // Handler for sprint selection
  onStartSprint={fn}        // Handler for start action
  onCompleteSprint={fn}     // Handler for complete action
  selectedSprintId={id}     // Currently selected sprint ID
  userRole="manager"        // User role for permissions
/>
```

### SprintDetailView
```jsx
<SprintDetailView
  sprint={obj}              // Sprint object
  isOpen={bool}             // Modal visibility
  onClose={fn}              // Close handler
  onUpdate={fn}             // Update handler
  onEdit={fn}               // Edit handler
  onStart={fn}              // Start handler
  onComplete={fn}           // Complete handler
  onAddTasks={fn}           // Add tasks handler
  userRole="manager"        // User role
/>
```

### SprintAnalytics
```jsx
<SprintAnalytics
  sprint={obj}              // Sprint object
  tasks={[]}                // Array of sprint tasks
/>
```

## 🔧 Utility Functions

```javascript
import {
  getSprintStatus,          // Get current sprint status
  calculateSprintProgress,  // Get time-based progress %
  getSprintMetrics,        // Get all metrics at once
  getRemainingDays,        // Get days until sprint end
  getHealthColor,          // Get health indicator color
  calculateBurndownData,   // Get burndown chart data
  formatSprintDates        // Format date range string
} from '../utils/sprintUtils';
```

## 📱 Responsive Breakpoints

| Screen Size | Columns | Layout |
|-------------|---------|--------|
| Mobile (<768px) | 1 | Stacked |
| Tablet (768-1024px) | 2 | Grid |
| Desktop (>1024px) | 3 | Grid |

## ⚡ Performance Tips

1. **Lazy Loading**: Modals only render when open
2. **Debounced Filters**: 150ms debounce on filter changes
3. **Optimistic Updates**: UI updates before server response
4. **Memoization**: Metrics calculated once per render
5. **Animation Throttling**: Respects `prefers-reduced-motion`

## 🐛 Troubleshooting

### Sprint doesn't appear
- Check project filter in TasksPage
- Verify sprint has valid dates
- Ensure project_id is set

### Can't start sprint
- Sprint must be in Planning status
- Sprint must have at least one task
- User must have manager role

### Drag and drop not working
- Check browser compatibility
- Ensure not in Analytics view
- Verify task has valid status

### Health score seems wrong
- Check task completion rates
- Verify due dates are set
- Review overdue task count

## 📞 Support Checklist

Before reporting issues:
- [ ] Clear browser cache
- [ ] Check browser console for errors
- [ ] Verify user role permissions
- [ ] Confirm data in database
- [ ] Test in different browser
- [ ] Review network tab for failed requests

## 🎓 Best Practices

### Creating Sprints
✅ Set clear, measurable goals  
✅ Use consistent naming (e.g., "Sprint 1", "Sprint 2")  
✅ Plan 2-week iterations  
✅ Assign to correct project  

### Managing Tasks
✅ Assign tasks before starting sprint  
✅ Set realistic due dates  
✅ Keep task status updated  
✅ Review stuck tasks in Review  

### Monitoring Health
✅ Check health daily  
✅ Address amber status quickly  
✅ Investigate red status immediately  
✅ Use analytics for insights  

---

**Quick Help**: See `SPRINT_MANAGEMENT_GUIDE.md` for detailed documentation.
