import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { FiMail, FiLock, FiUser, FiArrowRight, FiUserCheck, FiUsers, FiGithub } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 200, damping: 24, delayChildren: 0.2, staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

// Avatar URLs for random assignment
const AVATAR_URLS = [
  'https://i.imghippo.com/files/XHF3893M.jpeg',
  'https://i.imghippo.com/files/QBoU6103Ko.jpeg',
  'https://i.imghippo.com/files/fBoU9649gng.jpeg',
  'https://i.imghippo.com/files/yinH4907V.jpeg',
  'https://i.imghippo.com/files/Ta2332vQ.jpeg'
];

export default function AuthPage({ mode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Animated background gradient
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
          // Get a random avatar URL
          const randomAvatarUrl = AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];
          
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                name,
                email,
                role: role, // User selected role
                avatar_url: randomAvatarUrl
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
    backgroundImage: `radial-gradient(circle at ${gradientPosition.x * 100}% ${gradientPosition.y * 100}%, #e0e7ff 0%, #f0fdfa 100%)`,
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row items-stretch relative overflow-hidden">
      {/* Left: Illustration/Branding */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-indigo-500 via-blue-400 to-cyan-300 relative overflow-hidden">
        {/* Animated SVG or shapes */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-20 animate-pulse-slow" viewBox="0 0 800 800" fill="none">
          <circle cx="400" cy="400" r="300" fill="#fff" fillOpacity="0.1" />
          <circle cx="600" cy="200" r="120" fill="#fff" fillOpacity="0.08" />
        </svg>
        <div className="z-10 flex flex-col items-center">
          <img src="/vite.svg" alt="Logo" className="h-20 w-20 mb-6 drop-shadow-xl" />
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg mb-2 tracking-tight">SquadSync</h1>
          <p className="text-lg text-white/80 font-medium mb-8 text-center max-w-xs">Empower your team. Streamline your standups. Achieve more, together.</p>
        </div>
      </div>

      {/* Right: Form Card */}
      <div className="flex-1 flex items-center justify-center relative bg-white/80" style={gradientStyle}>
        {/* Animated background blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-30 animate-pulse-slow" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-200 rounded-full blur-3xl opacity-30 animate-pulse-slow" />
        <motion.div
          className="w-full max-w-lg mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-12 relative z-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="mb-8 text-center">
            <div className="flex justify-center mb-2">
              <div className="h-14 w-14 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">SR</span>
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 font-display">
              {mode === 'login' ? 'Welcome back' : 'Join SquadSync'}
            </h2>
            <p className="mt-2 text-base text-gray-600">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account to get started'}
            </p>
          </motion.div>

          {/* Social login buttons (UI only) */}
          <motion.div className="flex flex-col gap-3 mb-8" variants={itemVariants}>
            <button type="button" className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-sm font-semibold text-gray-700 transition-all">
              <FcGoogle className="text-xl" /> Continue with Google
            </button>
            <button type="button" className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-sm font-semibold text-gray-700 transition-all">
              <FiGithub className="text-xl" /> Continue with GitHub
            </button>
          </motion.div>

          <div className="flex items-center gap-2 mb-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-semibold uppercase">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

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
              className="space-y-6"
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
                        className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-base transition-all bg-white/90"
                        placeholder="John Doe"
                      />
                    </div>
                  </motion.div>
                )}
                <motion.div variants={itemVariants}>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
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
                      className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-base transition-all bg-white/90"
                      placeholder="you@example.com"
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
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-base transition-all bg-white/90"
                      placeholder="••••••••"
                    />
                  </div>
                </motion.div>
                {mode === 'signup' && (
                  <motion.div variants={itemVariants}>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white/90 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-base transition-all"
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                    </select>
                  </motion.div>
                )}
              </div>
              {error && (
                <motion.div
                  className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.div>
              )}
              <motion.button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-3 px-6 border border-transparent text-base font-semibold rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-all mt-4"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                disabled={loading}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Sign Up'}
                    <FiArrowRight />
                  </>
                )}
              </motion.button>
            </motion.form>
          )}

          <div className="mt-8 text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">Sign up</Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
