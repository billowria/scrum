import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

// Icons
import { FiMail, FiLock, FiUser, FiArrowRight, FiUserCheck, FiUsers } from 'react-icons/fi';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

export default function AuthPage({ mode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Background gradient animation
  const [gradientPosition, setGradientPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setGradientPosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        // Handle login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        navigate('/dashboard');
      } else {
        // Handle signup
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) throw signUpError;
        
        // If signup successful, create user profile with name and selected role
        if (data?.user) {
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                name,
                email,
                role: role // User selected role
                // No password_hash needed as we modified the schema
              },
            ]);
          
          if (profileError) throw profileError;
        }
        
        // Show success message or redirect
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic gradient style based on mouse position
  const gradientStyle = {
    backgroundImage: `radial-gradient(circle at ${gradientPosition.x * 100}% ${gradientPosition.y * 100}%, var(--tw-gradient-stops))`,
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div 
        className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-white to-secondary-50 opacity-80"
        style={gradientStyle}
      />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{animationDelay: '2s'}} />
      </div>

      <motion.div 
        className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-card"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">SR</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-display">
            {mode === 'login' ? 'Welcome back' : 'Join us today'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </motion.div>

        {success ? (
          <motion.div 
            className="bg-green-50 p-4 rounded-lg border border-green-200 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <h3 className="text-lg font-medium text-green-800">Account created successfully!</h3>
            <p className="text-green-700">Redirecting you to the dashboard...</p>
          </motion.div>
        ) : (
          <motion.form 
            className="mt-8 space-y-6" 
            onSubmit={handleSubmit}
            variants={containerVariants}
          >
            <div className="space-y-4 rounded-md">
              {mode === 'signup' && (
                <motion.div variants={itemVariants}>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </motion.div>
              )}
              
              <motion.div variants={itemVariants}>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-all"
                    placeholder="email@example.com"
                  />
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-all"
                    placeholder="••••••"
                  />
                </div>
              </motion.div>
              
              {/* Role selection - only shown during signup */}
              {mode === 'signup' && (
                <motion.div variants={itemVariants}>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div
                      className={`relative rounded-lg border ${
                        role === 'member' 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      } p-3 flex cursor-pointer transition-all`}
                      onClick={() => setRole('member')}
                    >
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                          role === 'member' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <FiUser className="h-3 w-3" />
                        </div>
                        <div className="ml-3">
                          <h3 className={`text-sm font-medium ${
                            role === 'member' ? 'text-primary-900' : 'text-gray-900'
                          }`}>
                            Member
                          </h3>
                          <p className="text-xs text-gray-500">Regular user account</p>
                        </div>
                      </div>
                    </div>
                    
                    <div
                      className={`relative rounded-lg border ${
                        role === 'manager' 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      } p-3 flex cursor-pointer transition-all`}
                      onClick={() => setRole('manager')}
                    >
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                          role === 'manager' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <FiUserCheck className="h-3 w-3" />
                        </div>
                        <div className="ml-3">
                          <h3 className={`text-sm font-medium ${
                            role === 'manager' ? 'text-primary-900' : 'text-gray-900'
                          }`}>
                            Manager
                          </h3>
                          <p className="text-xs text-gray-500">Team management access</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {error && (
              <motion.div 
                className="bg-red-50 p-3 rounded-lg text-sm text-red-600 border border-red-200"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {error}
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md transition-all"
                disabled={loading}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <FiArrowRight className="h-5 w-5 text-primary-300 group-hover:text-primary-200 transition-colors" />
                </span>
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  mode === 'login' ? 'Sign in' : 'Create account'
                )}
              </motion.button>
            </motion.div>
          </motion.form>
        )}
        
        <motion.div variants={itemVariants} className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
