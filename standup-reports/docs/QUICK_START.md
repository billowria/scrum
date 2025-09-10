# User Profile System - Quick Start Guide

This guide provides a quick overview of how to use the user profile system components.

## Overview

The user profile system includes:
- Individual user profiles with extended information
- Team member listings and management
- Role-based access control (members, managers, admins)
- Responsive components with modern UI

## Quick Integration

### 1. Add Profile Route

In your `App.jsx`:

```jsx
import ProfilePage from './pages/ProfilePage';

// Add to your routes
<Route path="/profile" element={<ProfilePage />} />
<Route path="/profile/:userId" element={<ProfilePage />} />
```

### 2. Add Profile Link to Navbar

In your `Navbar.jsx` dropdown:

```jsx
<button onClick={() => navigate('/profile')}>
  My Profile
</button>
```

### 3. Add Team Profiles Widget to Dashboard

In your `Dashboard.jsx`:

```jsx
import UserProfilesWidget from '../components/UserProfilesWidget';

<UserProfilesWidget userTeamId={userTeamId} currentUser={currentUser} />
```

## Component Usage

### UserProfile Component

Display a user's profile:

```jsx
import UserProfile from '../components/UserProfile';

// Current user's profile
<UserProfile />

// Specific user's profile
<UserProfile userId="user-uuid-here" />
```

### UserProfileModal Component

Display a profile in a modal:

```jsx
import UserProfileModal from '../components/UserProfileModal';

<UserProfileModal 
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  user={selectedUser}
  currentUser={currentUser}
/>
```

### ManagerUserProfile Component

Manager interface for team profiles:

```jsx
import ManagerUserProfile from '../components/ManagerUserProfile';

<ManagerUserProfile />
```

## Custom Hooks

### useUserProfile Hook

```jsx
import { useUserProfile } from '../hooks/useUserProfile';

const { profile, loading, error, updateProfile } = useUserProfile();
```

### useTeamProfiles Hook

```jsx
import { useTeamProfiles } from '../hooks/useUserProfile';

const { teamMembers, loading, error, updateTeamMember } = useTeamProfiles(teamId);
```

## Utility Functions

```jsx
import { 
  getUserProfile, 
  updateUserProfile, 
  getTeamMembers 
} from '../utils/profileUtils';

// Get a user's profile
const profile = await getUserProfile(userId);

// Update a user's profile
await updateUserProfile(userId, profileData);

// Get team members (managers only)
const teamMembers = await getTeamMembers(teamId);
```

## Security

The system implements Row Level Security (RLS):
- Users can only view/edit their own profiles
- Managers can view profiles of their team members
- Admins have full access to all profiles

## Styling

All components use Tailwind CSS and are fully responsive.

## Testing

Test with different user roles:
- Member: Can only edit their own profile
- Manager: Can view/edit team members' profiles
- Admin: Has full access to all profiles