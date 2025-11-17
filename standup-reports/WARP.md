# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SquadSync is a comprehensive team management application built with React, Supabase, and Tailwind CSS. It's designed for managing daily standup reports, team coordination, and project management with role-based access control.

## Development Commands

### Core Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

### Testing & Development
```bash
# No formal test suite configured - testing is done manually
# Test with different user roles: member, manager, admin
# Verify Supabase RLS policies are working correctly

# Database operations are handled through Supabase migrations
# Apply migrations through Supabase SQL Editor
```

### Supabase Operations
```bash
# Database migrations are in SQL files in the root directory
# Apply via Supabase dashboard SQL Editor:
# - database-migrations.sql (core schema)
# - initialize_*.sql files (data setup)
# - *_migration.sql files (feature-specific migrations)
```

## Architecture

### Technology Stack
- **Frontend**: React 19+ with Vite build tool
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (PostgreSQL + Authentication + RLS)
- **State Management**: React hooks and context
- **Animations**: Framer Motion
- **Routing**: React Router DOM v7

### Key Design Patterns

#### Role-Based Architecture
The application implements a 3-tier role system:
- **Members**: Basic users who can manage their own data
- **Managers**: Can manage team members and their data
- **Admins**: Full system access

#### Component Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Route-level page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── supabaseClient.js   # Supabase configuration
```

#### Database Pattern
- Primary tables: `users`, `teams`, `departments`, `projects`, `tasks`
- Role-based Row Level Security (RLS) policies
- Extensive use of database functions for complex operations
- Foreign key relationships for data integrity

### Core Features & Components

#### Authentication & User Management
- Supabase Auth integration
- Role-based routing and permissions
- Extended user profiles with `user_profiles` table
- Manager delegation and team assignments

#### Task Management
- Kanban-style task boards with drag-and-drop
- Sprint management with `sprints` table
- Task activities tracking
- Project-task relationships

#### Team Coordination
- Daily standup reports
- Leave management and calendar
- Team announcements system
- Real-time notifications

#### Dashboard Architecture
The main dashboard is modular:
- Role-specific dashboard components (`Dashboard`)
- Widget-based layout with `DashboardWidgets`
- Real-time data updates via Supabase subscriptions
- Direct access to specific management pages (Team Management, History, etc.)

### State Management Patterns

#### Authentication State
Managed in main `App.jsx` with session and user role tracking:
```jsx
const [session, setSession] = useState(null);
const [userRole, setUserRole] = useState(null);
const [userProfile, setUserProfile] = useState(null);
```

#### Custom Hooks
- `useUserProfile.js`: Profile data management
- `useRealTimeCounts.jsx`: Real-time dashboard metrics

### Database Schema Key Points

#### Core Tables
- `users`: Base user authentication and role data
- `user_profiles`: Extended profile information
- `teams`: Team organization
- `departments`: Organizational hierarchy
- `tasks`: Task management with status enum
- `daily_reports`: Standup report entries
- `announcements`: Team communication

#### Security Model
All tables implement Row Level Security (RLS):
- Users can only access their own data
- Managers can access their team members' data
- Admins have full access
- Policies defined in migration files

### Component Conventions

#### Page Components
Located in `src/pages/` and handle:
- Route-level state management
- Data fetching
- Layout composition
- Role-based access control

#### Reusable Components
Located in `src/components/` and follow:
- Single responsibility principle
- Props-based configuration
- Consistent Tailwind styling
- Framer Motion animations

#### Modal Pattern
Many features use modal dialogs:
- Consistent modal wrapper with backdrop
- Form validation and submission handling
- Success/error state management

### Styling System

#### Tailwind Configuration
Custom design system with:
- Primary, secondary, and accent color palettes
- Custom animations and keyframes
- Extended font families (Inter, Lexend)
- Card shadows and focus states

#### Animation Strategy
- Page transitions with `AnimatePresence`
- Micro-interactions on buttons and cards
- Loading states with custom spinners
- Smooth hover and focus transitions

## Development Guidelines

### Adding New Features
1. Consider role-based permissions from the start
2. Update database schema with proper RLS policies
3. Create reusable components where possible
4. Implement proper error handling and loading states
5. Follow the established modal pattern for dialogs

### Database Changes
1. Create migration SQL files in root directory
2. Test RLS policies with different user roles
3. Add proper foreign key relationships
4. Include database indexes for performance

### Component Development
1. Use the established Tailwind design system
2. Implement responsive design patterns
3. Add proper TypeScript types where beneficial
4. Follow the existing animation patterns

### Authentication Integration
- All API calls should respect Supabase RLS
- Use `supabase.auth.getUser()` for user context
- Handle authentication state changes properly
- Implement proper logout functionality

## Important Files

### Configuration
- `vite.config.js`: Build configuration
- `tailwind.config.js`: Design system configuration
- `eslint.config.js`: Code quality rules
- `package.json`: Dependencies and scripts

### Database
- `database-migrations.sql`: Core schema
- `tablestructure.txt`: Comprehensive table documentation
- Various `*_migration.sql` files: Feature-specific schemas

### Core Application
- `src/App.jsx`: Main application with routing and auth
- `src/supabaseClient.js`: Database connection configuration
- `src/components/Sidebar.jsx`: Navigation system

### Documentation
- `PROFILE_SYSTEM_README.md`: User profile system details
- `docs/QUICK_START.md`: Profile system integration guide
- `docs/INTEGRATION_GUIDE.md`: Detailed integration instructions

## Environment Setup

### Prerequisites
- Node.js 14+ 
- Supabase project with configured database
- Environment variables for Supabase connection

### Local Development
1. Clone repository
2. `npm install`
3. Configure Supabase credentials in `src/supabaseClient.js`
4. Apply database migrations via Supabase SQL Editor
5. `npm run dev`

### Production Deployment
- Static build output in `dist/` directory
- Compatible with Vercel, Netlify, or any static host
- Requires Supabase project configuration