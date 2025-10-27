import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUserPlus,
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiAlertCircle,
  FiUsers,
  FiShield,
  FiSend,
  FiRefreshCw,
  FiPlus,
  FiInfo
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import GlassmorphicToast from './GlassmorphicToast';

// Avatar URLs (predefined Supabase public URLs)
const AVATAR_URLS = [
  'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/6ACAFD4D-DA6A-4FE8-A482-CEF6299AF104_1_105_c.jpeg',
  'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/B94AFE2E-5D15-46F6-9EEB-7571975A8F14_1_105_c.jpeg',
  'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/C40EFEF2-6233-4834-B85C-64CCC37009BB_1_105_c.jpeg',
  'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/DA17C16A-2DF0-4F20-A3FB-A2EF13E4C98B_1_105_c.jpeg',
  'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/DDC03DE1-2A2A-4906-838F-D422C1D0B0CC_1_105_c.jpeg',
  'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/EDCED201-8799-4A1F-9B91-ACF8D65F0DE0_1_105_c.jpeg'
];

const AddMember = ({ onMemberAdded, onClose }) => {
  // Company context
  const { currentCompany } = useCompany();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
    team_id: ''
  });

  // UI state
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailError, setEmailError] = useState('');

  // Toast state
  const [toast, setToast] = useState({
    isVisible: false,
    type: 'success',
    message: '',
    description: ''
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delayChildren: 0.1,
        staggerChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 400, damping: 25 }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  useEffect(() => {
    fetchTeams();
  }, [currentCompany]);

  // Toast helper function
  const showToast = (type, message, description = null) => {
    setToast({
      isVisible: true,
      type,
      message,
      description
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;

    let strength = 0;
    // Length
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Character variety
    if (/[a-z]/.test(password)) strength += 1; // lowercase
    if (/[A-Z]/.test(password)) strength += 1; // uppercase
    if (/[0-9]/.test(password)) strength += 1; // numbers
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1; // special characters

    return Math.min(strength, 4);
  };

  const fetchTeams = async () => {
    try {
      if (!currentCompany?.id) return;

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('company_id', currentCompany.id) // Company filtering
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear general errors
    if (error) setError(null);

    // Real-time validation
    if (name === 'email') {
      if (!value) {
        setEmailError('');
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }

    if (name === 'password') {
      // Calculate password strength
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  // Comprehensive validation for single form
  const validateForm = () => {
    // Name validation
    if (!formData.name.trim()) {
      setError('Please enter a valid name');
      return false;
    }

    // Email validation
    if (!formData.email.trim()) {
      setError('Please enter an email address');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (!formData.password) {
      setError('Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (passwordStrength < 2) {
      setError('Password is too weak. Please include uppercase, numbers, or special characters.');
      return false;
    }

    setError(null);
    return true;
  };

  // Form reset function
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'member',
      team_id: ''
    });
    setPasswordStrength(0);
    setEmailError('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Company validation
    if (!currentCompany?.id) {
      setError('Company context not available');
      return;
    }

    if (!validateForm()) return;

    setError(null);
    setLoading(true);

    try {
      // Create user account
      const { error: signUpError, data } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;

      // If signup successful, create user profile
      if (data?.user) {
        // Get a random avatar URL
        const randomAvatarUrl = AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];

        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            team_id: formData.team_id || null,
            company_id: currentCompany.id, // ✅ Add company isolation
            avatar_url: randomAvatarUrl
          }]);

        if (profileError) throw profileError;

        // Show success toast
        showToast(
          'success',
          'Member Added Successfully!',
          `${formData.name} has been added to your team and will receive a welcome email.`
        );

        // Reset form for adding another member
        resetForm();

        // Call callback for parent component
        if (onMemberAdded) onMemberAdded();
      }
    } catch (error) {
      setError(error.message);
      showToast('error', 'Failed to add member', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Single comprehensive form rendering
  const renderForm = () => {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-3xl mb-6 shadow-2xl"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <FiUserPlus className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            Add New Team Member
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create a new user account and invite them to join your team
          </p>
        </div>

        {/* Main Form Content */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Personal Information */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                    <p className="text-sm text-gray-500">Basic details about the new member</p>
                  </div>
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm ${
                      emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                    required
                  />
                  {emailError && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="w-4 h-4" />
                      {emailError}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Column - Security & Role */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Security Section */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <FiLock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Security Setup</h2>
                    <p className="text-sm text-gray-500">Create a secure password</p>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                      placeholder="Enter password (min 6 characters)"
                      required
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </motion.button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Password Strength</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength === 0 ? 'text-red-600' :
                          passwordStrength === 1 ? 'text-orange-600' :
                          passwordStrength === 2 ? 'text-yellow-600' :
                          passwordStrength === 3 ? 'text-blue-600' :
                          'text-green-600'
                        }`}>
                          {passwordStrength === 0 ? 'Very Weak' :
                           passwordStrength === 1 ? 'Weak' :
                           passwordStrength === 2 ? 'Fair' :
                           passwordStrength === 3 ? 'Good' :
                           'Strong'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                              i < passwordStrength
                                ? i === 0 ? 'bg-red-500' :
                                  i === 1 ? 'bg-orange-500' :
                                  i === 2 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Role & Team Section */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <FiUsers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Role & Team</h2>
                    <p className="text-sm text-gray-500">Set permissions and team assignment</p>
                  </div>
                </div>

                {/* Role Field */}
                <div className="space-y-3 mb-6">
                  <label className="block text-sm font-semibold text-gray-700">
                    Role
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['member', 'manager'].map((role) => (
                      <motion.label
                        key={role}
                        className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          formData.role === role
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={formData.role === role}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            formData.role === role ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                          }`}>
                            {formData.role === role && (
                              <motion.div
                                className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 capitalize">{role}</span>
                        </div>
                      </motion.label>
                    ))}
                  </div>
                </div>

                {/* Team Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Team (Optional)
                  </label>
                  <select
                    name="team_id"
                    value={formData.team_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="">Select a team (optional)</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700"
              >
                <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <div className="flex justify-center">
            <motion.button
              type="submit"
              disabled={loading}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center gap-3 text-lg"
              whileHover={{ scale: loading ? 1 : 1.02, y: -2 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <FiUserPlus className="w-6 h-6" />
                  <span>Add Team Member</span>
                </div>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    );
  };

  // Full-page return with toast
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse delay-1500"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {renderForm()}
        </motion.div>
      </div>

      {/* Glassmorphic Toast Notification */}
      <GlassmorphicToast
        type={toast.type}
        message={toast.message}
        description={toast.description}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={5000}
      />
    </div>
  );
};

export default AddMember;