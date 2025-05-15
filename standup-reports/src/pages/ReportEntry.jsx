import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiCheckCircle, FiAlertCircle, FiClipboard, FiList, FiUsers } from 'react-icons/fi';

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
  const particles = Array.from({ length: 30 });
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
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
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
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .single();

        if (!userError && userData?.team_id) {
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

      // If user doesn't exist in users table, create a profile for them
      if (userError && userError.code === 'PGRST116') { // Not found error
        const { error: createUserError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email,
            name: user.email.split('@')[0], // Default name from email
            role: 'Member', // Default role
            team_id: selectedTeam // Add selected team
          }]);

        if (createUserError) {
          throw new Error(`Failed to create user profile: ${createUserError.message}`);
        }
      } else if (userError) {
        throw userError;
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

  return (
    <motion.div 
      className="max-w-4xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h1 
        className="text-3xl font-bold font-display mb-6 bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent"
        variants={itemVariants}
      >
        {existingReport ? 'Update Your Daily Report' : 'Submit Daily Report'}
      </motion.h1>
      
      <AnimatePresence>
        {message.text && (
          <motion.div 
            className={`p-4 mb-6 rounded-lg flex items-start ${
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
      
      <motion.form 
        onSubmit={handleSubmit} 
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-card p-8 border border-gray-100"
        variants={containerVariants}
      >
        <div className="mb-6">
          <motion.div variants={itemVariants}>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FiCalendar className="mr-2 text-primary-600" />
              Report Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
              max={new Date().toISOString().split('T')[0]} // Limit to today or earlier
            />
          </motion.div>
          
          {selectedTeam && (
            <motion.div variants={itemVariants} className="mt-2">
              <div className="flex items-center text-sm text-gray-600">
                <FiUsers className="mr-2 text-primary-600" />
                <span>Team: </span>
                <span className="ml-1 font-medium">
                  {teams.find(team => team.id === selectedTeam)?.name || 'Assigned Team'}
                </span>
              </div>
            </motion.div>
          )}
        </div>
        
        <motion.div variants={itemVariants} className="mb-6">
          <label htmlFor="yesterday" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <span className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-2 text-xs">1</span>
            What did you accomplish yesterday?
          </label>
          <textarea
            id="yesterday"
            value={yesterday}
            onChange={(e) => setYesterday(e.target.value)}
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
            placeholder="List your completed tasks from yesterday..."
            required
          />
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-6">
          <label htmlFor="today" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <span className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-2 text-xs">2</span>
            What will you work on today?
          </label>
          <textarea
            id="today"
            value={today}
            onChange={(e) => setToday(e.target.value)}
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
            placeholder="List your planned tasks for today..."
            required
          />
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-8">
          <label htmlFor="blockers" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <span className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-2 text-xs">3</span>
            Any blockers or impediments?
          </label>
          <textarea
            id="blockers"
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
            placeholder="Describe any blockers or issues preventing your progress (leave empty if none)..."
          />
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex justify-end">
          <motion.button
            type="submit"
            className="bg-gradient-to-r from-primary-600 to-primary-500 text-white py-2 px-6 rounded-lg hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-50 shadow-md"
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : existingReport ? 'Update Report' : 'Submit Report'}
          </motion.button>
        </motion.div>
      </motion.form>
      
      <AnimatePresence>
        {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} />}
      </AnimatePresence>
    </motion.div>
  );
}
