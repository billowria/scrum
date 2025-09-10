# Integrating User Profiles into SquadSync

This guide explains how to integrate the user profile system into your existing SquadSync application.

## 1. Database Setup

First, ensure the database schema is properly set up by running the migration script in your Supabase SQL editor:

1. Open the Supabase dashboard
2. Navigate to the SQL Editor
3. Run the `user_profiles.sql` script from the migrations folder

This creates:
- `user_profiles` table for storing extended profile information
- Views and functions for accessing profile data
- RLS policies for secure access control

## 2. File Structure

The profile system consists of the following components:

```
src/
├── components/
│   ├── UserProfile.jsx          # User profile display and editing
│   ├── UserProfileModal.jsx      # Modal version of user profile
│   ├── UserProfilesWidget.jsx    # Widget showing team members
│   └── ManagerUserProfile.jsx    # Manager interface for team profiles
├── pages/
│   ├── ProfilePage.jsx           # Route for individual profiles
│   └── ManagerProfilePage.jsx   # Route for manager profile management
├── hooks/
│   └── useUserProfile.js         # Custom hooks for profile data
├── utils/
│   └── profileUtils.js          # Utility functions for profile operations
└── supabase_migrations/
    └── user_profiles.sql         # Database migration script
```

## 3. Routing Integration

To add profile routes to your application, update your `App.jsx` file:

```jsx
// In App.jsx, add these routes to your authenticated routes section:

// Add import at the top
import ProfilePage from './pages/ProfilePage';
import ManagerProfilePage from './pages/ManagerProfilePage';

// In your Routes section, add:
<Route path="/profile" element={
  <PageTransition>
    <div className="w-full py-6">
      <ProfilePage />
    </div>
  </PageTransition>
} />
<Route path="/profile/:userId" element={
  <PageTransition>
    <div className="w-full py-6">
      <ProfilePage />
    </div>
  </PageTransition>
} />
<Route path="/manager/profiles" element={
  <PageTransition>
    <div className="w-full py-6">
      <ManagerProfilePage />
    </div>
  </PageTransition>
} />
```

## 4. Navbar Integration

To add a profile link to the navbar dropdown, update the `Navbar.jsx` component:

```jsx
// In Navbar.jsx, update the dropdown menu items:

{/* Profile Menu Item */}
<motion.button
  onClick={() => {
    setDropdownOpen(false);
    navigate('/profile');
  }}
  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50/80 transition-colors flex items-center gap-3 group"
  whileHover={{ x: 5 }}
  transition={{ type: 'spring', stiffness: 400 }}
>
  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
    <FiUser size={16} />
  </div>
  <span>My Profile</span>
</motion.button>
```

## 5. Dashboard Integration

To add the user profiles widget to the dashboard, update the `Dashboard.jsx` component:

```jsx
// In Dashboard.jsx:

// Add import at the top:
import UserProfilesWidget from '../components/UserProfilesWidget';

// In the JSX where you want to add the widget:
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
  {/* Other dashboard widgets */}
  
  {/* User Profiles Widget */}
  <div className="lg:col-span-1">
    <UserProfilesWidget userTeamId={userTeamId} currentUser={currentUser} />
  </div>
  
  {/* Other dashboard widgets */}
</div>
```

## 6. Using Profile Components

### UserProfile Component

The `UserProfile` component can be used to display a user's profile:

```jsx
import UserProfile from '../components/UserProfile';

// Display current user's profile
<UserProfile />

// Display specific user's profile
<UserProfile userId="user-uuid-here" />
```

### UserProfileModal Component

The `UserProfileModal` component displays a profile in a modal dialog:

```jsx
import UserProfileModal from '../components/UserProfileModal';

<UserProfileModal 
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  user={selectedUser}
  currentUser={currentUser}
/>
```

### UserProfilesWidget Component

The `UserProfilesWidget` component shows a list of team members:

```jsx
import UserProfilesWidget from '../components/UserProfilesWidget';

<UserProfilesWidget 
  userTeamId={teamId} 
  currentUser={currentUser} 
/>
```

## 7. Using Custom Hooks

The profile system includes custom hooks for easy data management:

### useUserProfile Hook

```jsx
import { useUserProfile } from '../hooks/useUserProfile';

const MyComponent = () => {
  const { profile, loading, error, updateProfile } = useUserProfile();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>{profile.name}</h1>
      <p>{profile.job_title}</p>
      {/* etc. */}
    </div>
  );
};
```

### useTeamProfiles Hook

```jsx
import { useTeamProfiles } from '../hooks/useUserProfile';

const ManagerComponent = () => {
  const { teamMembers, loading, error, updateTeamMember } = useTeamProfiles(teamId);
  
  // Use teamMembers, loading, error, and updateTeamMember as needed
};
```

## 8. Utility Functions

The `profileUtils.js` file contains helpful utility functions:

```jsx
import { 
  getUserProfile, 
  updateUserProfile, 
  getTeamMembers, 
  updateTeamMemberProfile 
} from '../utils/profileUtils';

// Get a user's profile
const profile = await getUserProfile(userId);

// Update a user's profile
await updateUserProfile(userId, profileData);

// Get team members (for managers)
const teamMembers = await getTeamMembers(teamId);

// Update a team member's profile (for managers)
await updateTeamMemberProfile(userId, profileData);
```

## 9. Styling

All components use Tailwind CSS for styling and are fully responsive. The components will automatically adapt to different screen sizes and color schemes.

## 10. Security Considerations

The profile system implements Row Level Security (RLS) policies to ensure:

- Users can only view/edit their own profiles
- Managers can view profiles of their team members
- Admins have full access to all profiles

These policies are defined in the database migration script and enforced by Supabase.

## 11. Error Handling

All components include proper error handling and display user-friendly error messages. Network errors, validation errors, and permission errors are all handled gracefully.

## 12. Performance Optimizations

The profile system includes several performance optimizations:

- Efficient database queries using views and functions
- Client-side caching with React hooks
- Proper indexing in the database
- Lazy loading of profile data
- Memoization of expensive calculations

## 13. Testing

To test the profile system:

1. Create test users with different roles (member, manager, admin)
2. Verify that RLS policies are working correctly
3. Test profile creation, reading, updating, and deletion
4. Verify that managers can only access their team members' profiles
5. Test error conditions and edge cases

## 14. Troubleshooting

Common issues and solutions:

1. **Profile not loading**: Check Supabase connection and RLS policies
2. **Permission denied**: Verify user role and RLS policy configuration
3. **Data not saving**: Check for validation errors and database constraints
4. **Styling issues**: Ensure Tailwind CSS is properly configured

## 15. Extending the System

To extend the profile system:

1. Add new fields to the `user_profiles` table
2. Update the database view and functions
3. Modify the React components to display the new fields
4. Update the utility functions and hooks
5. Test thoroughly with all user roles

The modular design makes it easy to add new features like:
- Profile picture uploads
- Custom profile fields
- Profile visibility settings
- Social media integrations
- Profile analytics