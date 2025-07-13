import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './supabaseClient';
import { FiTwitter, FiGithub, FiLinkedin, FiYoutube } from 'react-icons/fi';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ReportEntry from './pages/ReportEntry';
import History from './pages/History';
import LeaveCalendar from './pages/LeaveCalendar';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamManagement from './pages/TeamManagement';
import AchievementsPage from './pages/AchievementsPage';
import ManageAnnouncements from './components/ManageAnnouncements';
import DepartmentManagement from './pages/DepartmentManagement';
import TasksPage from './pages/TasksPage';
import NotificationsPage from './pages/NotificationsPage';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  // Fetch user profile (name, avatar_url, role)
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, role, avatar_url')
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="relative">
          {/* Animated loading spinner */}
          <div className="h-16 w-16 relative">
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-primary-200"></div>
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">AP</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {session ? (
        <>
          <Navbar user={userProfile || { name: '', role: userRole || 'member', avatar: null, avatar_url: null }} />
          <div className="flex pt-16">
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
            <div className={`flex-1 min-h-screen bg-gray-50 transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-20'}`}>
              <AppContent session={session} userRole={userRole} sidebarOpen={sidebarOpen} />
            </div>
          </div>
        </>
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
      <div className={session ? "pt-10" : ""}>
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
                <Route path="/dashboard" element={
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
                          <ManagerDashboard activeTabDefault="leave-requests" />
                        </div>
                      </PageTransition>
                    } />
                    <Route path="/manager-dashboard" element={
                      <PageTransition>
                        <div className="w-full py-6">
                          <ManagerDashboard />
                        </div>
                      </PageTransition>
                    } />
                    <Route path="/history" element={
                      <PageTransition>
                        <div className="w-full py-6">
                          <History />
                        </div>
                      </PageTransition>
                    } />
                  </>
                )}
                <Route path="/report" element={
                  <PageTransition>
                    <div className="w-full py-6">
                      <ReportEntry />
                    </div>
                  </PageTransition>
                } />
                <Route path="/leave-calendar" element={
                  <PageTransition>
                    <div className="w-full py-6">
                      <LeaveCalendar />
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
                    <div className="w-full py-6">
                      <NotificationsPage />
                    </div>
                  </PageTransition>
                } />
                <Route path="/department-management" element={<DepartmentManagement />} />
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
