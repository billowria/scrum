import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './supabaseClient';
import { FiTwitter, FiGithub, FiLinkedin, FiYoutube } from 'react-icons/fi';
import brandLogo from './assets/brand/squadsync-logo.png';
import { CompanyProvider } from './contexts/CompanyContext';
import { TaskModalProvider } from './contexts/TaskModalContext';
import { useTheme } from './context/ThemeContext';
import StarsBackground from './components/shared/StarsBackground';
import OceanBackground from './components/shared/OceanBackground';
import ForestBackground from './components/shared/ForestBackground';
import DiwaliBackground from './components/shared/DiwaliBackground';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Import the new profile components
import UserProfile from './components/UserProfile';
import ManagerUserProfile from './components/ManagerUserProfile';
import PublicLayout from './layouts/PublicLayout';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import StandupReports from './pages/StandupReports';
import ReportEntry from './pages/ReportEntryNew';
import History from './pages/History';
import LeaveCalendar from './pages/LeaveCalendar';
import TeamManagement from './pages/TeamManagement';
import SubscriptionPage from './pages/SubscriptionPage';
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

import FloatingAIButton from './components/ai/FloatingAIButton';

import AnalyticsDashboard from './pages/AnalyticsDashboard';
import SubscriptionGuard from './components/SubscriptionGuard';
import LandingPage from './pages/LandingPage';
import CompanyPage from './pages/CompanyPage';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

function AppLoader() {
  const { theme } = useTheme();

  return (
    <div className={`grid min-h-screen place-items-center transition-all duration-700 ${theme === 'dark'
      ? 'bg-slate-950 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]'
      : 'bg-gradient-to-br from-primary-50/60 via-white to-secondary-50/60'
      }`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative w-[340px] rounded-[2rem] border p-10 shadow-3xl backdrop-blur-2xl transition-all duration-700 ${theme === 'dark'
          ? 'border-white/10 bg-slate-900/40 shadow-[0_0_50px_-12px_rgba(59,130,246,0.15)]'
          : 'border-gray-200 bg-white/80 shadow-2xl'
          }`}
        role="status"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-8">
          <div className="relative h-32 w-32">
            {/* Outer Ring */}
            <div className={`absolute inset-0 rounded-full border-2 transition-colors duration-700 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'
              }`} />

            {/* Animated Rings */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-transparent"
              style={{ borderTopColor: '#3b82f6' }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border-4 border-transparent opacity-50"
              style={{ borderBottomColor: '#60a5fa' }}
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            />

            {/* Center Logo Area */}
            <div className={`absolute inset-6 grid place-items-center rounded-full shadow-inner transition-all duration-700 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'
              }`}>
              <motion.img
                src={brandLogo}
                alt="Sync"
                className="h-12 w-12 object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="text-center space-y-2">
            <motion.div
              className={`font-display text-2xl font-black tracking-tight transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Loading <span className="text-blue-500">Sync</span>
            </motion.div>
            <motion.div
              className={`text-sm font-medium transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                }`}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              Preparing your workspace…
            </motion.div>
          </div>

          {/* Progress Bar Container */}
          <div className={`h-1.5 w-full overflow-hidden rounded-full transition-colors duration-700 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
            }`}>
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "linear"
              }}
              style={{ width: '60%' }}
            />
          </div>

          <motion.div
            className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-500/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            v2.1.0 Premium
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [sidebarMode, setSidebarMode] = useState(window.innerWidth < 1024 ? 'hidden' : 'collapsed'); // 'expanded', 'collapsed', 'hidden'
  const [userProfile, setUserProfile] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Check for active session on load with robust validation
    const initializeAuth = async () => {
      try {
        // 1. Get the session first (fast)
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession) {
          // 2. Validate with getUser (secure, checks database/token validity)
          const { data: { user }, error } = await supabase.auth.getUser();

          if (error || !user) {
            console.warn('Session found but user validation failed, signing out.');
            await supabase.auth.signOut();
            setSession(null);
            setLoading(false);
          } else {
            // Valid session and user
            setSession(initialSession);
            fetchUserRole(user.id);
            fetchUserProfile(user.id);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setSession(null);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          // Verify user exists on session start/change to be safe, 
          // or trust the event. GetUser is safest but adds latency.
          // For auth state change events, we can generally trust the session provided
          // as it comes from the Supabase client's internal state management.
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



  const getMarginLeft = () => {
    if (isMobile) return '0px';
    switch (sidebarMode) {
      case 'expanded':
        return '272px';
      case 'collapsed':
        return '100px';
      case 'hidden':
        return '0px';
      default:
        return '272px';
    }
  };

  return (
    <Router>
      {session ? (
        <CompanyProvider>
          <>
            <TaskModalProvider>
              <Navbar
                user={userProfile || { name: '', role: userRole || 'member', avatar: null, avatar_url: null }}
                sidebarMode={sidebarMode}
                setSidebarMode={setSidebarMode}
              />
              <FloatingAIButton />
              <div className="flex pt-14 md:pt-16 bg-gray-50 dark:bg-slate-950 min-h-screen">
                <Sidebar
                  mode={sidebarMode}
                  setMode={setSidebarMode}
                  user={userProfile || { name: '', role: userRole || 'member', avatar: null, avatar_url: null }}
                />
                <div className="flex-1 flex min-h-screen">
                  <div
                    className="flex-1 bg-gray-50 dark:bg-slate-950 overflow-hidden relative"
                    style={{
                      marginLeft: getMarginLeft(),
                      transition: 'margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <AppContent session={session} userRole={userRole} sidebarMode={sidebarMode} />
                  </div>
                </div>
              </div>
            </TaskModalProvider>
          </>
        </CompanyProvider>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/30">
          <AppContent session={session} userRole={userRole} sidebarMode={sidebarMode} />
        </div>
      )}
    </Router>
  );
}

// Separate component to handle dynamic content based on routes
function AppContent({ session, userRole, sidebarMode }) {
  const location = useLocation();
  const background = location.state && location.state.background;
  const sidebarOpen = sidebarMode === 'expanded';
  const { themeMode, staticBackground, noMouseInteraction, hideParticles } = useTheme();

  return (
    <div className={session ? "min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950" : "min-h-screen"}>
      {/* Animated Theme Backgrounds - paused/hideParticles controlled via props */}
      {themeMode === 'space' && <StarsBackground paused={staticBackground} hideParticles={hideParticles} disableMouseInteraction={noMouseInteraction} />}
      {themeMode === 'ocean' && <OceanBackground paused={staticBackground} hideParticles={hideParticles} disableMouseInteraction={noMouseInteraction} />}
      {themeMode === 'forest' && <ForestBackground paused={staticBackground} hideParticles={hideParticles} disableMouseInteraction={noMouseInteraction} />}
      {themeMode === 'diwali' && <DiwaliBackground paused={staticBackground} hideParticles={hideParticles} disableMouseInteraction={noMouseInteraction} />}

      {/* NavbarPro is removed, so we'll keep the original Navbar for now */}
      {/* <NavbarPro session={session} /> */}
      <div>
        <AnimatePresence mode="sync" initial={false}>
          <Routes location={background || location}>
            {!session ? (
              // Unauthenticated routes
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/company" element={<CompanyPage />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/signup" element={<AuthPage mode="signup" />} />
                <Route path="/forgot" element={<AuthPage mode="forgot" />} />
                <Route path="/reset-password" element={<AuthPage mode="reset" />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Route>
            ) : (
              // Authenticated routes
              // Authenticated routes
              <Route path="*" element={
                <SubscriptionGuard>
                  <Routes location={background || location}>
                    <Route path="/dashboard" element={
                      <PageTransition>
                        <Dashboard sidebarOpen={sidebarOpen} sidebarMode={sidebarMode} />
                      </PageTransition>
                    } />
                    <Route path="/standup-reports" element={
                      <PageTransition>
                        <div className="w-full py-6">
                          <StandupReports sidebarMode={sidebarMode} />
                        </div>
                      </PageTransition>
                    } />
                    {/* Manager-specific routes */}
                    {(userRole === 'manager' || userRole === 'admin') && (
                      <>
                        <Route path="/team-management" element={
                          <PageTransition>
                            <div className="w-full py-6">
                              <TeamManagement sidebarMode={sidebarMode} />
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
                        {/* Create User Route - accessible as standalone or modal */}
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
                        <Route path="/subscription" element={
                          <PageTransition>
                            <div className="w-full py-6">
                              <SubscriptionPage sidebarMode={sidebarMode} />
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
                          <LeaveCalendar sidebarOpen={sidebarOpen} sidebarMode={sidebarMode} />
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
                          <TasksPage sidebarOpen={sidebarOpen} sidebarMode={sidebarMode} />
                        </div>
                      </PageTransition>
                    } />
                    <Route path="/notifications" element={
                      <PageTransition>
                        <div className="w-full h-full">
                          <NotificationCenterV2 sidebarOpen={sidebarOpen} sidebarMode={sidebarMode} />
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
                        <NotesPage sidebarOpen={sidebarOpen} sidebarMode={sidebarMode} />
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

                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </SubscriptionGuard>
              } />
            )}
          </Routes>
        </AnimatePresence>

        {/* Modal Routes */}
        <AnimatePresence>
          {background && (
            <Routes>
              <Route path="/create-user" element={<CreateUser />} />
            </Routes>
          )}
        </AnimatePresence>
      </div>
    </div >
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
