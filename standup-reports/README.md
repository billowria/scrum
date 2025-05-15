# Standup Reports Application

A modern web application for managing daily standup reports within teams. Built with React, Tailwind CSS, and Supabase.

## Features

- **User Authentication**: Secure login and registration system
- **Team Management**: Users belong to teams for organized reporting
- **Daily Reports**: Submit and track daily standup updates (yesterday's work, today's plan, blockers)
- **Dashboard View**: See all team members' reports for the current day
- **Historical Reports**: Browse and filter past reports by date and team
- **Export Functionality**: Download reports as CSV for record-keeping

## Tech Stack

- **Frontend**: React with Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, authentication, storage)
- **State Management**: React hooks and context

## Database Schema

The application uses the following tables in Supabase:

- **Teams**: `id`, `name`
- **Users**: `id`, `name`, `email`, `password_hash`, `role`, `team_id`
- **DailyReports**: `id`, `user_id`, `date`, `yesterday`, `today`, `blockers`, `created_at`, `updated_at`

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure your Supabase credentials in `src/supabaseClient.js`
4. Start the development server:
   ```
   npm run dev
   ```

## Usage

### Authentication

Users can register with email/password and will be assigned to a team.

### Submitting Reports

Once logged in, users can submit their daily standup report with:
- Tasks completed yesterday
- Tasks planned for today
- Any blockers or impediments

### Viewing Reports

The dashboard shows all reports for the current day, organized by team.
The history page allows browsing past reports with filtering options.

## Deployment

Build the production version:

```
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

