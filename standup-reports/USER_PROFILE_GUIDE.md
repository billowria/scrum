# User Profile System

## Overview

The user profile system allows users to view and edit their personal information, with managers having additional capabilities to manage team members' profiles.

## Features

1. **User Profile Viewing**
   - View personal information
   - View work-related information
   - View contact information
   - View social links

2. **Profile Editing**
   - Edit personal information (for own profile)
   - Edit work information (for own profile)
   - Edit contact information (for own profile)
   - Edit social links (for own profile)

3. **Manager Capabilities**
   - View all team members' profiles
   - Edit team members' profiles
   - Manage team member information

## How to Access Profiles

1. **From Navbar**
   - Click on your avatar in the top right corner
   - Select "My Profile" from the dropdown menu
   - This will navigate to `/profile` (your own profile)

2. **From Team Member Lists**
   - In any list of team members (e.g., UserListModal)
   - Click on a team member to view their profile
   - This will navigate to `/profile/{user-id}`

3. **Direct URL Access**
   - Visit `/profile` to view your own profile
   - Visit `/profile/{user-id}` to view a specific user's profile (if you have permission)

## Profile Information

### Personal Information
- Name
- Email
- Bio

### Work Information
- Job Title
- Role
- Team
- Start Date

### Contact Information
- Phone Number
- Slack Handle

### Social Links
- LinkedIn Profile

## Permissions

### Regular Users
- Can view their own profile
- Can edit their own profile
- Can view other users' profiles (read-only)

### Managers
- Can view their own profile
- Can edit their own profile
- Can view all team members' profiles
- Can edit team members' profiles

### Administrators
- Have the same permissions as managers
- Plus additional administrative capabilities (coming soon)

## Technical Details

### Database Structure

The profile system uses two main tables:

1. **users** - Core user information
2. **user_profiles** - Extended profile information

A view (`user_info`) combines these tables for easy access to all profile data.

### API Functions

Several PostgreSQL functions are provided:

- `get_user_profile(user_id)` - Retrieves complete profile information
- `upsert_user_profile(...)` - Creates or updates a user profile

### React Components

1. **UserProfile** - Main profile display/editing component
2. **UserListModal** - Displays lists of users with clickable profiles
3. **UserProfileModal** - Modal version of user profile (deprecated in favor of full page)

### Hooks

1. **useUserProfile** - Custom hook for managing user profile data
2. **useTeamProfiles** - Custom hook for managers to manage team profiles

## Integration Guide

### Adding Profile Links

To add a link to a user's profile:

```jsx
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const navigate = useNavigate();
  
  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };
  
  return (
    <button onClick={() => handleViewProfile('user-id-here')}>
      View Profile
    </button>
  );
};
```

### Using the UserProfile Component

```jsx
import UserProfile from '../components/UserProfile';

// Display current user's profile
<UserProfile />

// Display specific user's profile
<UserProfile userId="specific-user-id" />
```

## Troubleshooting

### Profile Not Loading

1. Check browser console for errors
2. Verify Supabase connection
3. Check Row Level Security (RLS) policies
4. Ensure user is authenticated

### Permission Denied

1. Verify user role
2. Check RLS policies in Supabase
3. Ensure user has appropriate permissions

### Profile Not Saving

1. Check for validation errors in browser console
2. Verify required fields are filled
3. Check network tab for failed requests
4. Verify user has edit permissions

## Future Enhancements

Planned improvements to the profile system:

1. Profile picture upload
2. Custom profile fields
3. Profile privacy settings
4. Social media integration
5. Profile analytics
6. Advanced search and filtering
7. Profile activity history

## Support

For issues with the profile system, please:

1. Check the browser console for error messages
2. Verify your internet connection
3. Try refreshing the page
4. Contact technical support if problems persist