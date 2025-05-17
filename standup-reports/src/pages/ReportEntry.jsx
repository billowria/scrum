import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiCheckCircle, FiAlertCircle, FiClipboard, FiList, FiUsers, FiSend, FiArrowRight, FiStar } from 'react-icons/fi';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
  hover: {
    y: -5,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
    transition: { type: 'spring', stiffness: 500, damping: 30 }
  }
};

const inputFocusVariants = {
  rest: { scale: 1, borderColor: 'rgba(209, 213, 219, 1)' },
  focus: { scale: 1.01, borderColor: 'rgba(79, 70, 229, 1)' },
};

// Particle component for success animation
const Particle = ({ color }) => {
  const randomX = Math.random() * 200 - 100;
  const randomY = Math.random() * 200 - 100;
  const size = Math.random() * 8 + 4;
  
  return (
    <motion.div
      className="absolute rounded-full"
      style={{ 
        backgroundColor: color,
        width: size,
        height: size,
      }}
      initial={{ x: 0, y: 0, opacity: 1 }}
      animate={{
        x: randomX,
        y: randomY,
        opacity: 0,
        scale: 0
      }}
      transition={{ duration: 1 + Math.random() * 0.5, ease: 'easeOut' }}
    />
  );
};

// Success animation component
const SuccessAnimation = ({ onComplete }) => {
  const particles = Array.from({ length: 40 });
  const colors = ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#bae6fd'];
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative">
        <motion.div 
          className="bg-white rounded-full p-8 shadow-lg"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <FiCheckCircle className="h-16 w-16 text-green-500" />
        </motion.div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {particles.map((_, i) => (
            <Particle key={i} color={colors[i % colors.length]} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Step indicator component
const StepIndicator = ({ step }) => {
  const steps = ['Yesterday', 'Today', 'Blockers'];
  
  return (
    <div className="mb-8 flex justify-center">
      <div className="flex items-center">
        {steps.map((label, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <motion.div 
                className={`h-0.5 w-8 sm:w-16 ${index < step ? 'bg-primary-500' : 'bg-gray-200'}`}
                initial={false}
                animate={index < step ? { backgroundColor: '#4f46e5' } : { backgroundColor: '#e5e7eb' }}
                transition={{ duration: 0.3 }}
              />
            )}
            <motion.div 
              className="flex flex-col items-center"
              initial={false}
              animate={index < step ? { scale: 1 } : index === step ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <motion.div 
                className={`h-10 w-10 flex items-center justify-center rounded-full ${
                  index < step 
                    ? 'bg-primary-500 text-white' 
                    : index === step 
                      ? 'bg-primary-500 text-white ring-4 ring-primary-100' 
                      : 'bg-gray-200 text-gray-500'
                }`}
                initial={false}
                animate={
                  index < step 
                    ? { backgroundColor: '#4f46e5', color: '#ffffff' } 
                    : index === step 
                      ? { backgroundColor: '#4f46e5', color: '#ffffff', boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.2)' } 
                      : { backgroundColor: '#e5e7eb', color: '#6b7280' }
                }
                transition={{ duration: 0.3 }}
              >
                {index < step ? (
                  <FiCheckCircle className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </motion.div>
              <motion.span 
                className={`mt-1 text-xs sm:text-sm ${
                  index <= step ? 'text-primary-600 font-medium' : 'text-gray-500'
                }`}
                initial={false}
                animate={
                  index <= step 
                    ? { color: '#4f46e5', fontWeight: 500 } 
                    : { color: '#6b7280', fontWeight: 400 }
                }
                transition={{ duration: 0.3 }}
              >
                {label}
              </motion.span>
            </motion.div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default function ReportEntry() {
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingReport, setExistingReport] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Refs for form elements
  const yesterdayRef = useRef(null);
  const todayRef = useRef(null);
  const blockersRef = useRef(null);
  
  // Controls for animations
  const controls = useAnimation();
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user already has a report for the selected date and fetch teams
    const initializeData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name');

        if (teamsError) {
          console.error('Error fetching teams:', teamsError);
        } else {
          setTeams(teamsData || []);
        }

        // Fetch user's team
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .single();

        if (!userDataError && userData?.team_id) {
          setSelectedTeam(userData.team_id);
        }

        // Check for existing report
        const { data, error } = await supabase
          .from('daily_reports')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', date)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error('Error checking for existing report:', error);
          return;
        }

        if (data) {
          // Found existing report, populate form
          setExistingReport(data);
          setYesterday(data.yesterday || '');
          setToday(data.today || '');
          setBlockers(data.blockers || '');
          setMessage({ type: 'info', text: 'Editing existing report for this date.' });
        } else {
          // No existing report
          setExistingReport(null);
          setYesterday('');
          setToday('');
          setBlockers('');
          setMessage({ type: '', text: '' });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    initializeData();
    setCurrentStep(0);
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTeam) {
      setMessage({ type: 'error', text: 'You must be assigned to a team by a manager to submit reports' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch user data to check if profile exists
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      // If user doesn't exist in users table, create a profile for them
      if (userDataError && userDataError.code === 'PGRST116') { // Not found error
        const { error: createUserError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email,
            name: user.email.split('@')[0], // Default name from email
            role: 'member', // Default role
            team_id: selectedTeam // Add selected team
          }]);

        if (createUserError) {
          throw new Error(`Failed to create user profile: ${createUserError.message}`);
        }
      } else if (userDataError) {
        throw userDataError;
      } else if (userData && selectedTeam !== userData.team_id) {
        // Update user's team if it has changed
        const { error: updateTeamError } = await supabase
          .from('users')
          .update({ team_id: selectedTeam })
          .eq('id', user.id);
          
        if (updateTeamError) {
          console.error('Error updating team:', updateTeamError);
        }
      }

      // Prepare report data
      const reportData = {
        user_id: user.id,
        date,
        yesterday,
        today,
        blockers,
        updated_at: new Date().toISOString()
      };

      let result;

      if (existingReport) {
        // Update existing report
        result = await supabase
          .from('daily_reports')
          .update(reportData)
          .eq('id', existingReport.id);
      } else {
        // Insert new report
        reportData.created_at = new Date().toISOString();
        result = await supabase
          .from('daily_reports')
          .insert([reportData]);
      }

      const { error } = result;

      if (error) throw error;

      // Show success message and animation
      setMessage({
        type: 'success',
        text: existingReport 
          ? 'Your report has been updated successfully!' 
          : 'Your report has been submitted successfully!'
      });
      
      // Show success animation and navigate back to dashboard
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Error submitting report:', error);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuccessComplete = () => {
    navigate('/dashboard');
  };
  
  // Focus correct field when step changes
  useEffect(() => {
    if (currentStep === 0 && yesterdayRef.current) {
      yesterdayRef.current.focus();
    } else if (currentStep === 1 && todayRef.current) {
      todayRef.current.focus();
    } else if (currentStep === 2 && blockersRef.current) {
      blockersRef.current.focus();
    }
  }, [currentStep]);
  
  // Handle next step
  const handleNextStep = () => {
    if (currentStep < 2) {
      controls.start({
        x: [-5, 0],
        transition: { duration: 0.2 }
      });
      setCurrentStep(prevStep => prevStep + 1);
    } else {
      // On final step, submit the form
      document.getElementById("report-form").requestSubmit();
    }
  };
  
  // Check if current step is valid and can proceed
  const canProceed = () => {
    if (currentStep === 0) return yesterday.trim().length > 0;
    if (currentStep === 1) return today.trim().length > 0;
    return true; // Blockers can be empty
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // If shift+enter is pressed, move to next step or submit
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault(); // Prevent default newline behavior
      if (canProceed()) {
        handleNextStep();
      }
    }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div 
        className="text-center mb-8"
        variants={itemVariants}
      >
        <motion.h1 
          className="text-3xl font-bold font-display mb-2 bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent inline-flex items-center gap-2"
          whileHover={{ scale: 1.03 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <FiClipboard className="text-primary-500" />
        {existingReport ? 'Update Your Daily Report' : 'Submit Daily Report'}
      </motion.h1>
        <motion.p 
          className="text-gray-500 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Share your progress with your team in a structured way to enhance collaboration and transparency.
        </motion.p>
      </motion.div>
      
      <AnimatePresence>
        {message.text && (
          <motion.div 
            className={`p-4 mb-6 rounded-lg flex items-start max-w-2xl mx-auto ${
              {
                success: 'bg-green-50 text-green-700 border border-green-100',
                error: 'bg-red-50 text-red-700 border border-red-100',
                info: 'bg-blue-50 text-blue-700 border border-blue-100'
              }[message.type]
            }`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {message.type === 'success' && <FiCheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />}
            {message.type === 'error' && <FiAlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />}
            {message.type === 'info' && <FiClipboard className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />}
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <StepIndicator step={currentStep} />
      
      <motion.form 
        id="report-form"
        onSubmit={handleSubmit} 
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 sm:p-8 border border-gray-100 overflow-hidden"
        variants={cardVariants}
        whileHover="hover"
      >
        <motion.div 
          className="mb-8 flex justify-center"
          variants={itemVariants}
        >
          <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-1 max-w-md w-full">
            <motion.div 
              className="flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium cursor-pointer"
              onClick={() => setDate(new Date().toISOString().split('T')[0])}
              whileHover={{ backgroundColor: "rgba(79, 70, 229, 0.1)" }}
              animate={date === new Date().toISOString().split('T')[0] ? 
                { backgroundColor: "rgba(79, 70, 229, 0.2)", color: "#4f46e5" } : 
                { backgroundColor: "transparent", color: "#6b7280" }
              }
            >
              Today
            </motion.div>
            
            <div className="bg-white rounded-md shadow-sm flex-1 flex relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
                className="w-full px-10 py-2 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm font-medium"
              max={new Date().toISOString().split('T')[0]} // Limit to today or earlier
            />
            </div>
          </div>
          </motion.div>
          
          {selectedTeam && (
          <motion.div 
            variants={itemVariants} 
            className="mb-4 flex justify-center"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiUsers />
              <span>Team: {teams.find(team => team.id === selectedTeam)?.name || 'Assigned Team'}</span>
            </motion.div>
            </motion.div>
          )}
        
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="yesterday-section"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <motion.div 
                variants={itemVariants}
                className="mb-2"
              >
                <div className="flex justify-between items-end">
                  <label htmlFor="yesterday" className="block text-base font-medium text-gray-700 flex items-center">
                    <FiStar className="mr-2 text-primary-400" />
            What did you accomplish yesterday?
          </label>
                  <span className="text-xs text-gray-400">{yesterday.length} characters</span>
                </div>
              </motion.div>
              
              <motion.div
                initial="rest"
                whileFocus="focus"
                variants={inputFocusVariants}
                className="relative"
              >
          <textarea
                  ref={yesterdayRef}
            id="yesterday"
            value={yesterday}
            onChange={(e) => setYesterday(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows="5"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
                  placeholder="List your completed tasks from yesterday... (Shift+Enter to continue)"
            required
          />
                <div className="absolute inset-0 pointer-events-none rounded-lg border-2 border-primary-500 opacity-0 focus-within:opacity-20 transition-opacity"></div>
        </motion.div>
        
              <div className="mt-2 text-xs text-primary-600 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Pro tip: Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> to quickly continue to the next step</span>
              </div>
            </motion.div>
          )}
          
          {currentStep === 1 && (
            <motion.div
              key="today-section"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <motion.div 
                variants={itemVariants}
                className="mb-2"
              >
                <div className="flex justify-between items-end">
                  <label htmlFor="today" className="block text-base font-medium text-gray-700 flex items-center">
                    <FiStar className="mr-2 text-primary-400" />
            What will you work on today?
          </label>
                  <span className="text-xs text-gray-400">{today.length} characters</span>
                </div>
              </motion.div>
              
              <motion.div
                initial="rest"
                whileFocus="focus"
                variants={inputFocusVariants}
                className="relative"
              >
          <textarea
                  ref={todayRef}
            id="today"
            value={today}
            onChange={(e) => setToday(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows="5"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
                  placeholder="List your planned tasks for today... (Shift+Enter to continue)"
            required
          />
                <div className="absolute inset-0 pointer-events-none rounded-lg border-2 border-primary-500 opacity-0 focus-within:opacity-20 transition-opacity"></div>
        </motion.div>
        
              <div className="mt-2 text-xs text-primary-600 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Pro tip: Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> to quickly continue to the next step</span>
              </div>
            </motion.div>
          )}
          
          {currentStep === 2 && (
            <motion.div
              key="blockers-section"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <motion.div 
                variants={itemVariants}
                className="mb-2"
              >
                <div className="flex justify-between items-end">
                  <label htmlFor="blockers" className="block text-base font-medium text-gray-700 flex items-center">
                    <FiStar className="mr-2 text-primary-400" />
            Any blockers or impediments?
          </label>
                  <span className="text-xs text-gray-400">{blockers.length} characters</span>
                </div>
              </motion.div>
              
              <motion.div
                initial="rest"
                whileFocus="focus"
                variants={inputFocusVariants}
                className="relative"
              >
          <textarea
                  ref={blockersRef}
            id="blockers"
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows="5"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
                  placeholder="Describe any blockers or issues preventing your progress (leave empty if none)... (Shift+Enter to submit)"
          />
                <div className="absolute inset-0 pointer-events-none rounded-lg border-2 border-primary-500 opacity-0 focus-within:opacity-20 transition-opacity"></div>
              </motion.div>
              
              <div className="mt-2 text-xs text-primary-600 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Pro tip: Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> to submit your report</span>
              </div>
        </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div 
          variants={itemVariants} 
          className="flex justify-between gap-4 mt-8"
          animate={controls}
        >
          <motion.button
            type="button"
            className={`px-4 py-2 border border-gray-300 rounded-lg ${currentStep === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
            onClick={() => currentStep > 0 && setCurrentStep(prevStep => prevStep - 1)}
            disabled={currentStep === 0}
            whileHover={currentStep > 0 ? { scale: 1.02 } : {}}
            whileTap={currentStep > 0 ? { scale: 0.98 } : {}}
          >
            Back
          </motion.button>
          
          <motion.button
            type="button"
            onClick={handleNextStep}
            className={`flex items-center gap-1 px-6 py-2 rounded-lg text-white shadow-md ${
              canProceed() 
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={!canProceed() || loading}
            whileHover={canProceed() ? { scale: 1.03 } : {}}
            whileTap={canProceed() ? { scale: 0.97 } : {}}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              <>
                {currentStep < 2 ? 'Continue' : (existingReport ? 'Update Report' : 'Submit Report')}
                {currentStep < 2 ? <FiArrowRight /> : <FiSend />}
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.form>
      
      <AnimatePresence>
        {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} />}
      </AnimatePresence>
    </motion.div>
  );
}
