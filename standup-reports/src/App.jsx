import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './supabaseClient';
import { FiTwitter, FiGithub, FiLinkedin, FiYoutube } from 'react-icons/fi';
import brandLogo from './assets/brand/squadsync-logo.png';
import { CompanyProvider } from './contexts/CompanyContext';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Import the new profile components
import UserProfile from './components/UserProfile';
import ManagerUserProfile from './components/ManagerUserProfile';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ReportEntry from './pages/ReportEntryNew';
import History from './pages/History';
import LeaveCalendar from './pages/LeaveCalendar';
import TeamManagement from './pages/TeamManagement';
import AchievementsPage from './pages/AchievementsPage';
import LeaveManagement from './components/LeaveManagement';
import ManageAnnouncements from './components/ManageAnnouncements';
import CreateUser from './pages/CreateUser';

import TasksPage from './pages/TasksPage';
import NotificationCenterV2 from './pages/NotificationCenterV2';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './projects/pages/ProjectDetailPage';
// import ProjectManagementPage from './pages/ProjectManagementPage'; // Removed - functionality integrated
import ChatPage from './pages/ChatPage';
import NotesPage from './pages/NotesPage';

import AnalyticsDashboard from './pages/AnalyticsDashboard';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

function AppLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-primary-50/60 via-white to-secondary-50/60">
      <div
        className="relative w-[320px] rounded-3xl border border-gray-200 bg-white/70 p-8 shadow-2xl backdrop-blur-xl"
        role="status"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="relative h-28 w-28">
            <div className="absolute inset-0 rounded-full border-2 border-gray-100" />
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-transparent"
              style={{ borderTopColor: 'rgb(2 132 199)' }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-3 rounded-full border-4 border-transparent"
              style={{ borderBottomColor: 'rgb(20 184 166)' }}
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            />
            <div className="absolute inset-6 grid place-items-center rounded-full bg-white shadow-inner">
              <img
                src={brandLogo}
                alt="WorkOS"
                className="h-10 w-10 object-contain"
                decoding="async"
              />
            </div>
          </div>

          <div className="text-center">
            <div className="font-display text-lg font-semibold text-gray-800">Loading WorkOS</div>
            <motion.div
              className="mt-1 text-sm text-gray-500"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            >
              Preparing your workspace…
            </motion.div>
          </div>

          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary-300 via-primary-500 to-primary-300"
              animate={{ x: ['-120%', '220%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Check for active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchUserRole(session.user.id);
          fetchUserProfile(session.user.id);
        } else {
          setUserRole(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
  
  // Fetch user role from database
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserRole(data?.role || 'member');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('member'); // Default to member role if error
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile (id, name, avatar_url, role)
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role, avatar_url, team_id')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  if (loading) {
    return <AppLoader />;
  }

  return (
    <Router>
      {session ? (
        <CompanyProvider>
          <>
            <Navbar
              user={userProfile || { name: '', role: userRole || 'member', avatar: null, avatar_url: null }}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            <div className="flex pt-16">
              <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} user={userProfile || { name: '', role: userRole || 'member', avatar: null, avatar_url: null }} />
              <div className="flex-1 flex min-h-screen">
                <div
                  className="flex-1 bg-gray-50 overflow-hidden relative"
                  style={{
                    marginLeft: sidebarOpen
                      ? 'clamp(292px, 20vw, 308px)'  // Responsive: 292px (mobile) to 308px (desktop) - 20px buffer (reduced for 272px sidebar)
                      : 'clamp(120px, 10vw, 116px)',   // Responsive: 120px (mobile) to 116px (desktop) - 20px buffer
                    transition: 'margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <AppContent session={session} userRole={userRole} sidebarOpen={sidebarOpen} />
                </div>
              </div>
            </div>
          </>
        </CompanyProvider>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/30">
          <AppContent session={session} userRole={userRole} sidebarOpen={sidebarOpen} />
        </div>
      )}
    </Router>
  );
}

// Separate component to handle dynamic content based on routes
function AppContent({ session, userRole, sidebarOpen }) {
  const location = useLocation();

  return (
    <div className={session ? "min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/30" : "min-h-screen"}>
      {/* NavbarPro is removed, so we'll keep the original Navbar for now */}
      {/* <NavbarPro session={session} /> */}
      <div>
        <AnimatePresence mode="sync" initial={false}>
          <Routes>
            {!session ? (
              // Unauthenticated routes
              <>
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/signup" element={<AuthPage mode="signup" />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              // Authenticated routes
              <>
                {/* CompanyProvider needs to be handled differently */}\n                <Route path="/dashboard" element={
                  <PageTransition>
                    <div className="w-full py-6">
                      <Dashboard sidebarOpen={sidebarOpen} />
                    </div>
                  </PageTransition>
                } />
                {/* Manager-specific routes */}
                {userRole === 'manager' && (
                  <>
                    <Route path="/team-management" element={
                      <PageTransition>
                        <div className="w-full py-6">
                          <TeamManagement />
                        </div>
                      </PageTransition>
                    } />
                    <Route path="/leave-requests" element={
                      <PageTransition>
                        <div className="w-full py-6">
                          <LeaveManagement />
                        </div>
                      </PageTransition>
                    } />
                    <Route path="/manager-dashboard" element={
                      <PageTransition>
                        <Navigate to="/team-management" replace />
                      </PageTransition>
                    } />
                    <Route path="/history" element={
                      <PageTransition>
                        <div className="w-full py-6">
                          <History />
                        </div>
                      </PageTransition>
                    } />
                    {/* Create User Route */}
                    <Route path="/create-user" element={
                      <PageTransition>
                        <CreateUser />
                      </PageTransition>
                    } />
                    {/* Manager Profile Route */}
                    <Route path="/manager/profiles" element={
                      <PageTransition>
                        <div className="w-full py-6">
                          <ManagerUserProfile />
                        </div>
                      </PageTransition>
                    } />
                  </>
                )}
                {/* Manager and admin routes */}
                {(userRole === 'manager' || userRole === 'admin') && (
                  <Route path="/leave-management" element={
                    <PageTransition>
                      <div className="w-full py-6">
                        <LeaveManagement />
                      </div>
                    </PageTransition>
                  } />
                )}
                <Route path="/report" element={
                  <ReportEntry />
                } />
                <Route path="/leave-calendar" element={
                  <PageTransition>
                    <div className="w-full py-6">
                      <LeaveCalendar sidebarOpen={sidebarOpen} />
                    </div>
                  </PageTransition>
                } />
                <Route path="/announcements" element={
                  <PageTransition>
                    <div className="w-full py-6">
                      <ManageAnnouncements />
                    </div>
                  </PageTransition>
                } />
                <Route path="/achievements" element={
                  <PageTransition>
                    <div className="w-full py-6">
                      <AchievementsPage />
                    </div>
                  </PageTransition>
                } />
                <Route path="/tasks" element={
                  <PageTransition>
                    <div className="w-full py-6">
                      <TasksPage sidebarOpen={sidebarOpen} />
                    </div>
                  </PageTransition>
                } />
                <Route path="/notifications" element={
                  <PageTransition>
                    <div className="w-full h-full">
                      <NotificationCenterV2 sidebarOpen={sidebarOpen} />
                    </div>
                  </PageTransition>
                } />

                <Route path="/projects" element={
                  <PageTransition>
                    <ProjectsPage />
                  </PageTransition>
                } />
                <Route path="/projects/:projectId" element={
                  <PageTransition>
                    <ProjectDetailPage />
                  </PageTransition>
                } />
                {/* ProjectManagement routes removed - functionality integrated into ProjectDetailPage */}
                <Route path="/analytics-dashboard" element={
                  <PageTransition>
                    <div className="w-full py-6">
                      <AnalyticsDashboard />
                    </div>
                  </PageTransition>
                } />
                
                {/* Chat Route */}
                <Route path="/chat" element={<ChatPage />} />
                
                {/* Notes Route */}
                <Route path="/notes" element={
                  <PageTransition>
                    <NotesPage sidebarOpen={sidebarOpen} />
                  </PageTransition>
                } />
                
                {/* Profile Routes */}
                <Route path="/profile" element={
                  <PageTransition>
                    <div className="w-full py-6">
                      <UserProfile />
                    </div>
                  </PageTransition>
                } />
                <Route path="/profile/:userId" element={
                  <PageTransition>
                    <div className="w-full py-6">
                      <UserProfile />
                    </div>
                  </PageTransition>
                } />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Page transition wrapper component
function PageTransition({ children }) {
  const location = useLocation();
  
  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full"
      transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

export default App;
