-- This script doesn't actually modify the database, but serves as documentation
-- for how to add a profile link to the existing navigation system

/*
To add a profile link to the sidebar navigation, you would update the 
navigation configuration in the frontend code. Here's how you could modify
the existing navigation structure:

1. In src/components/Sidebar.jsx, add a new navigation item:

{
  to: '/profile',
  icon: <FiUser />,
  label: 'Profile',
  gradient: 'from-purple-500 to-indigo-600',
  shadowColor: 'rgba(168, 85, 247, 0.5)',
  description: 'Your profile settings',
  badge: null,
  shortcut: '⌘P'
}

2. In src/App.jsx, add a new route for the profile page:

<Route path="/profile" element={
  <PageTransition>
    <div className="w-full py-6">
      <UserProfile />
    </div>
  </PageTransition>
} />

3. Make sure to import the UserProfile component:
   import UserProfile from './components/UserProfile';

This is just documentation since the actual navigation is in the React code,
not in the database.
*/