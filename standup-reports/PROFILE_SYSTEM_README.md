# User Profile System Documentation

This document explains the user profile system implemented in the SquadSync application.

## Overview

The user profile system consists of:

1. **Database Structure**: Extended user profiles stored in a separate `user_profiles` table
2. **Frontend Components**: Multiple UI components for viewing and editing profiles
3. **Access Points**: Several ways to access user profiles throughout the application
4. **Role-Based Permissions**: Different profile management capabilities based on user roles

## Database Structure

### `user_profiles` Table

The `user_profiles` table stores extended profile information separately from the core `users` table:

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    job_title TEXT,
    bio TEXT,
    start_date DATE,
    phone TEXT,
    slack_handle TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);
```

## Frontend Components

### 1. UserProfile Component (`/src/components/UserProfile.jsx`)

A component for users to view and edit their own profiles:
- Personal information (name, email, bio)
- Work information (job title, start date)
- Contact information (phone, Slack handle, LinkedIn)
- Social links

### 2. UserProfileModal Component (`/src/components/UserProfileModal.jsx`)

A modal dialog for viewing detailed user profiles:
- Full profile information display
- Edit functionality for own profile
- Clean, responsive design

### 3. UserProfilesWidget Component (`/src/components/UserProfilesWidget.jsx`)

A compact widget showing team members with quick access to their profiles:
- Team member list with avatars
- Job titles and roles
- Click to open detailed profile modal

### 4. ManagerProfileManagement Component (`/src/components/ManagerProfileManagement.jsx`)

A comprehensive management interface for managers:
- View all team members' profiles
- Edit any team member's profile information
- Search and filter team members
- Detailed profile editing interface

### 5. DashboardWidgets Component (`/src/components/DashboardWidgets.jsx`)

Integrates profile widgets into the dashboard:
- Places the UserProfilesWidget in the dashboard layout

## Access Points

### 1. Navbar Dropdown

Users can access their own profile through the user dropdown in the navbar:
- Click user avatar/name in top right corner
- Select "My Profile" from the dropdown menu

### 2. Dashboard Integration

Team members are visible directly on the dashboard:
- UserProfilesWidget shows all team members
- Click any team member to view their profile

### 3. Dedicated Profile Routes

Direct access to profile pages:
- `/profile` - User's own profile
- `/profile/:userId` - Specific user's profile (for managers)
- `/manager/profiles` - Manager profile management interface

## Role-Based Permissions

### Regular Users (Members)

Can view and edit their own profile:
- Access via navbar dropdown
- Edit personal information
- Update contact details
- Add social links
- Cannot edit other users' profiles

### Managers

Have additional profile management capabilities:
- View all team members' profiles
- Edit any team member's profile
- Access dedicated management interface
- Search/filter team members
- Bulk profile updates (future enhancement)

### Administrators

Have the highest level of access:
- View/edit all user profiles
- Access all management features
- Additional administrative controls (future enhancement)

## Implementation Details

### Profile Data Fetching

Profiles are fetched using Supabase RPC functions:
- `get_user_profile(user_id)` - Gets complete profile information
- Real-time updates through Supabase subscriptions

### Profile Updates

Profiles can be updated through:
- Direct table updates for `user_profiles`
- Upsert operations to create or update profiles
- Automatic timestamp updates using triggers

### Security

Row Level Security (RLS) policies ensure proper access control:
- Users can only view/edit their own profiles
- Managers can view team members' profiles
- Admins have full access to all profiles

### Styling

All components use:
- Tailwind CSS for consistent styling
- Framer Motion for smooth animations
- Responsive design for all device sizes
- Dark mode support (where implemented)

## Future Enhancements

Planned improvements to the profile system:
1. Profile picture upload and management
2. Custom profile fields
3. Profile visibility settings
4. Integration with external services (Google, Microsoft)
5. Profile analytics and insights
6. Team directory enhancements
7. Advanced search and filtering
8. Profile activity history

## Usage Examples

### Adding Profile Widget to Dashboard

```jsx
// In Dashboard.jsx
import DashboardWidgets from '../components/DashboardWidgets';

// Add to dashboard JSX:
<DashboardWidgets userTeamId={userTeamId} currentUser={currentUser} />
```

### Accessing Profile from Code

```jsx
// Navigate to user's own profile
navigate('/profile');

// Navigate to specific user's profile
navigate(`/profile/${userId}`);

// Navigate to manager profile management
navigate('/manager/profiles');
```

### Profile Data Structure

```javascript
{
  id: 'uuid',
  user_id: 'uuid',
  avatar_url: 'https://example.com/avatar.jpg',
  job_title: 'Software Engineer',
  bio: 'Experienced developer with expertise in React and Node.js',
  start_date: '2023-01-15',
  phone: '+1 (555) 123-4567',
  slack_handle: 'john_doe',
  linkedin_url: 'https://linkedin.com/in/johndoe',
  created_at: '2023-01-15T10:30:00Z',
  updated_at: '2023-06-01T14:22:00Z'
}
```

## Troubleshooting

Common issues and solutions:

1. **Profile not loading**: Check Supabase connection and RLS policies
2. **Permission denied**: Verify user role and RLS policy configuration
3. **Data not saving**: Check for validation errors and database constraints
4. **Styling issues**: Ensure Tailwind CSS is properly configured

For additional support, consult the Supabase documentation and React component documentation.