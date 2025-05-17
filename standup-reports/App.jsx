import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ReportEntry from './pages/ReportEntry';
import LeaveCalendar from './pages/LeaveCalendar';
import AchievementsPage from './pages/AchievementsPage';
import UserAchievements from './pages/UserAchievements';
import ManagerDashboard from './pages/ManagerDashboard';
import History from './pages/History';
import TeamManagement from './pages/TeamManagement';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="manager-dashboard" element={<ManagerDashboard />} />
        <Route path="report" element={<ReportEntry />} />
        <Route path="calendar" element={<LeaveCalendar />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="my-achievements" element={<UserAchievements />} />
        <Route path="user-achievements/:userId" element={<UserAchievements />} />
        <Route path="history" element={<History />} />
        <Route path="team" element={<TeamManagement />} />
      </Route>
    </Routes>
  );
}

export default App; 