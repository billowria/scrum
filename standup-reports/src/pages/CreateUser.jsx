import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import { FiArrowLeft, FiUser, FiMail, FiLock, FiUsers, FiEye, FiEyeOff, FiCheck, FiX, FiShield, FiZap, FiAward, FiActivity, FiTrendingUp, FiStar, FiSettings, FiSmartphone, FiCalendar, FiMapPin, FiBriefcase, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import GlassmorphicToast from '../components/GlassmorphicToast';

const CreateUser = () => {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [particles, setParticles] = useState([]);
  const [ripples, setRipples] = useState([]);
  const containerRef = useRef(null);
  const controls = useAnimation();

  // Enhanced form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'member',
    team_id: '',
    department: '',
    position: '',
    bio: '',
    phone: '',
    location: '',
    startDate: '',
    skills: [],
    preferences: {
      theme: 'light',
      notifications: true,
      twoFactor: false,
      weeklyReports: true
    }
  });

  // Enhanced UI state
  const [teams, setTeams] = useState([]);
  const [departments] = useState([
    'Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Customer Success'
  ]);
  const [positions] = useState([
    'Junior Developer', 'Senior Developer', 'Tech Lead', 'Engineering Manager', 'CTO',
    'Designer', 'Senior Designer', 'Design Lead', 'Creative Director',
    'Marketing Specialist', 'Marketing Manager', 'CMO',
    'Sales Representative', 'Sales Manager', 'Head of Sales',
    'HR Specialist', 'HR Manager', 'Head of People',
    'Financial Analyst', 'CFO', 'Accountant',
    'Operations Manager', 'COO', 'Customer Success Manager'
  ]);
  const [skills, setSkills] = useState([
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'UI/UX Design', 'Project Management',
    'Communication', 'Leadership', 'Data Analysis', 'Machine Learning', 'DevOps'
  ]);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [formHistory, setFormHistory] = useState([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Interactive states
  const [floatingElements, setFloatingElements] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [validationState, setValidationState] = useState({});
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Toast state
  const [toast, setToast] = useState({
    isVisible: false,
    type: 'success',
    message: '',
    description: ''
  });

  // Advanced animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8, rotateX: 15 },
    visible: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 1.2,
        ease: "easeOut",
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      rotateX: -15,
      transition: { duration: 0.6 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, rotateZ: 2 },
    visible: {
      opacity: 1,
      y: 0,
      rotateZ: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  const floatingVariants = {
    initial: { y: 0, rotate: 0 },
    animate: {
      y: [-10, 10, -10],
      rotate: [-5, 5, -5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const particleVariants = {
    initial: {
      x: 0,
      y: 0,
      scale: 0,
      opacity: 0
    },
    animate: {
      x: [0, Math.random() * 100 - 50],
      y: [0, Math.random() * 100 - 50],
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeOut"
      }
    }
  };

  // Enhanced effects
  useEffect(() => {
    fetchTeams();
    initializeParticles();
    startMouseTracking();
    initializeFloatingElements();

    return () => {
      stopMouseTracking();
    };
  }, [currentCompany]);

  // Mouse tracking for interactive effects
  const startMouseTracking = () => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  };

  const stopMouseTracking = () => {
    window.removeEventListener('mousemove', () => {});
  };

  // Initialize particles
  const initializeParticles = () => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 0.5 + 0.1,
      opacity: Math.random() * 0.5 + 0.1
    }));
    setParticles(newParticles);
  };

  // Initialize floating elements
  const initializeFloatingElements = () => {
    const elements = [
      { icon: FiZap, color: 'from-yellow-400 to-orange-500', delay: 0 },
      { icon: FiAward, color: 'from-purple-400 to-pink-500', delay: 0.5 },
      { icon: FiActivity, color: 'from-blue-400 to-cyan-500', delay: 1 },
      { icon: FiTrendingUp, color: 'from-green-400 to-emerald-500', delay: 1.5 },
      { icon: FiStar, color: 'from-indigo-400 to-purple-500', delay: 2 }
    ];
    setFloatingElements(elements);
  };

  // Calculate form progress
  useEffect(() => {
    calculateFormProgress();
  }, [formData]);

  const calculateFormProgress = () => {
    const requiredFields = ['name', 'email', 'password', 'confirmPassword'];
    const filledRequired = requiredFields.filter(field => formData[field]).length;
    const progress = (filledRequired / requiredFields.length) * 100;
    setFormProgress(progress);
  };

  // Add ripple effect
  const addRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);
  };

  const fetchTeams = async () => {
    if (!currentCompany?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('name');

      if (error) throw error;
      setTeams(data || []);

      // Animate success
      if (data && data.length > 0) {
        showToast('success', 'Teams Loaded', `Found ${data.length} teams in your company`);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      showToast('error', 'Failed to load teams', 'Please try refreshing the page');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced password strength calculation with real-time feedback
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;

    let strength = 0;
    const feedback = [];

    // Length check
    if (password.length >= 12) strength += 30;
    else if (password.length >= 8) strength += 20;
    else if (password.length >= 6) strength += 10;
    else feedback.push('Use at least 6 characters');

    // Complexity checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      strength += 20;
    } else {
      feedback.push('Mix uppercase and lowercase letters');
    }

    if (/\d/.test(password)) {
      strength += 15;
    } else {
      feedback.push('Include numbers');
    }

    if (/[^a-zA-Z\d]/.test(password)) {
      strength += 20;
    } else {
      feedback.push('Add special characters');
    }

    // Bonus for unique characters
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) strength += 15;

    return Math.min(strength, 100);
  };

  // Get password strength color with gradients
  const getPasswordStrengthColor = (strength) => {
    if (strength < 25) return 'from-red-500 to-red-600';
    if (strength < 50) return 'from-orange-500 to-orange-600';
    if (strength < 75) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  // Get password strength text with emojis
  const getPasswordStrengthText = (strength) => {
    if (strength < 25) return { text: 'Weak', emoji: '😟' };
    if (strength < 50) return { text: 'Fair', emoji: '😐' };
    if (strength < 75) return { text: 'Good', emoji: '😊' };
    return { text: 'Strong', emoji: '🔥' };
  };

  // Enhanced avatar generation with predefined URLs
  const generateRandomAvatar = async () => {
    setIsGeneratingAvatar(true);

    // Simulate generation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const AVATAR_URLS = [
      'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/6ACAFD4D-DA6A-4FE8-A482-CEF6299AF104_1_105_c.jpeg',
      'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/B94AFE2E-5D15-46F6-9EEB-7571975A8F14_1_105_c.jpeg',
      'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/C40EFEF2-6233-4834-B85C-64CCC37009BB_1_105_c.jpeg',
      'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/DA17C16A-2DF0-4F20-A3FB-A2EF13E4C98B_1_105_c.jpeg',
      'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/DDC03DE1-2A2A-4906-838F-D422C1D0B0CC_1_105_c.jpeg',
      'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/EDCED201-8799-4A1F-9B91-ACF8D65F0DE0_1_105_c.jpeg'
    ];

    const avatarUrl = AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];

    setAvatarPreview(avatarUrl);
    setIsGeneratingAvatar(false);

    // Add celebration animation
    controls.start({
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
      transition: { duration: 0.6 }
    });

    return avatarUrl;
  };

  // Email suggestions generator
  const generateEmailSuggestions = (name) => {
    if (!name) return [];

    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com'];
    const nameParts = name.toLowerCase().split(' ');
    const suggestions = [];

    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];

      suggestions.push(`${firstName}@${domains[0]}`);
      suggestions.push(`${firstName}${lastName}@${domains[0]}`);
      suggestions.push(`${firstName}.${lastName}@${domains[0]}`);
      suggestions.push(`${firstName[0]}${lastName}@${domains[0]}`);
    } else if (nameParts.length === 1) {
      const firstName = nameParts[0];
      suggestions.push(`${firstName}@${domains[0]}`);
      suggestions.push(`${firstName}123@${domains[0]}`);
    }

    return suggestions;
  };

  // Enhanced form field validation
  const validateField = (name, value) => {
    const fieldErrors = { ...errors };
    delete fieldErrors[name];

    switch (name) {
      case 'name':
        if (!value.trim()) {
          fieldErrors.name = 'Name is required';
        } else if (value.trim().length < 2) {
          fieldErrors.name = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s'-]+$/.test(value)) {
          fieldErrors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
        }
        break;

      case 'email':
        if (!value.trim()) {
          fieldErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          fieldErrors.email = 'Please enter a valid email address';
        }
        break;

      case 'password':
        if (!value) {
          fieldErrors.password = 'Password is required';
        } else if (value.length < 6) {
          fieldErrors.password = 'Password must be at least 6 characters';
        }
        setPasswordStrength(calculatePasswordStrength(value));
        break;

      case 'confirmPassword':
        if (!value) {
          fieldErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          fieldErrors.confirmPassword = 'Passwords do not match';
        }
        break;

      case 'phone':
        if (value && !/^[+]?[\d\s-()]+$/.test(value)) {
          fieldErrors.phone = 'Please enter a valid phone number';
        }
        break;
    }

    setErrors(fieldErrors);
    setValidationState(prev => ({
      ...prev,
      [name]: !fieldErrors[name] && value ? 'valid' : value ? 'invalid' : 'empty'
    }));
  };

  // Form history management
  const saveFormState = () => {
    const newState = { ...formData, timestamp: Date.now() };
    setFormHistory(prev => [...prev.slice(-9), newState]);
    setCanUndo(true);
    setCanRedo(false);
  };

  const undoFormChange = () => {
    if (formHistory.length > 1) {
      const newHistory = [...formHistory];
      newHistory.pop(); // Remove current state
      const previousState = newHistory[newHistory.length - 1];
      setFormData(prev => ({ ...prev, ...previousState }));
      setFormHistory(newHistory);
      setCanUndo(newHistory.length > 1);
      setCanRedo(true);
    }
  };

  const redoFormChange = () => {
    // Implementation for redo functionality
    setCanRedo(false);
  };

  // Enhanced form input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);

    // Save current state for undo functionality
    saveFormState();

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Enhanced field validation
    validateField(name, value);

    // Special handling for name field to generate email suggestions
    if (name === 'name') {
      const suggestions = generateEmailSuggestions(value);
      setEmailSuggestions(suggestions);
      setShowEmailSuggestions(suggestions.length > 0 && !formData.email);
    }

    // Auto-set start date to today if not set
    if (name === 'startDate' && !value) {
      setFormData(prev => ({
        ...prev,
        startDate: new Date().toISOString().split('T')[0]
      }));
    }
  };

  // Handle skill selection
  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  // Handle preference changes
  const handlePreferenceChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  // Select email suggestion
  const selectEmailSuggestion = (email) => {
    setFormData(prev => ({ ...prev, email }));
    setShowEmailSuggestions(false);
    validateField('email', email);
  };

  // Enhanced form validation with detailed feedback
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    const requiredFields = ['name', 'email', 'password', 'confirmPassword'];
    requiredFields.forEach(field => {
      if (!formData[field] || !formData[field].trim()) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
      }
    });

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Password confirmation
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enhanced form submission with success animation
  const handleSubmit = async (e) => {
    e.preventDefault();
    addRipple(e);

    if (!validateForm()) {
      showToast('error', 'Validation Error', 'Please fix the errors below');
      return;
    }

    if (!currentCompany?.id) {
      showToast('error', 'Company Error', 'No company selected. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Define avatar URLs
      const AVATAR_URLS = [
        'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/6ACAFD4D-DA6A-4FE8-A482-CEF6299AF104_1_105_c.jpeg',
        'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/B94AFE2E-5D15-46F6-9EEB-7571975A8F14_1_105_c.jpeg',
        'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/C40EFEF2-6233-4834-B85C-64CCC37009BB_1_105_c.jpeg',
        'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/DA17C16A-2DF0-4F20-A3FB-A2EF13E4C98B_1_105_c.jpeg',
        'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/DDC03DE1-2A2A-4906-838F-D422C1D0B0CC_1_105_c.jpeg',
        'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/EDCED201-8799-4A1F-9B91-ACF8D65F0DE0_1_105_c.jpeg'
      ];

      // Use avatar if available, otherwise select a random one from the predefined list
      let finalAvatarUrl = avatarPreview;
      if (!finalAvatarUrl) {
        finalAvatarUrl = AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            department: formData.department,
            position: formData.position
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Insert into the users table with all provided information
        const { error: userError } = await supabase
          .from('users')
          .upsert({ 
            id: authData.user.id,
            company_id: currentCompany.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            team_id: formData.team_id || null
          }, { onConflict: ['id'] });

        if (userError) throw userError;
        
        // Insert profile information into user_profiles table
        const profileData = {
          user_id: authData.user.id,
          phone: formData.phone,
          avatar_url: finalAvatarUrl
        };

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([profileData]);

        if (profileError) throw profileError;

        // Show success animation
        setShowSuccessAnimation(true);
        showToast('success', 'User Created Successfully!', `${formData.name} has been added to your company.`);

        // Start countdown for modal close
        let count = 3;
        setCountdown(count);
        const countdownInterval = setInterval(() => {
          count--;
          setCountdown(count);
          if (count === 0) {
            clearInterval(countdownInterval);
            navigate('/dashboard');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create user';

      if (error.message.includes('already registered')) {
        errorMessage = 'A user with this email already exists';
      } else if (error.message.includes('weak password')) {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.message.includes('duplicate key')) {
        errorMessage = 'This email is already registered';
      }

      showToast('error', 'Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Toast functions
  const showToast = (type, message, description = '') => {
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undoFormChange();
      }
      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canRedo) redoFormChange();
      }
      // Escape to go back
      if (e.key === 'Escape') {
        navigate('/dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo]);

  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => navigate('/dashboard')}
        />

        {/* Modal Container */}
        <motion.div
          className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute w-32 h-32 bg-white/10 rounded-full blur-2xl"
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ top: '20%', left: '10%' }}
              />
              <motion.div
                className="absolute w-24 h-24 bg-white/10 rounded-full blur-2xl"
                animate={{
                  x: [0, -80, 0],
                  y: [0, 60, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ top: '60%', right: '15%' }}
              />
            </div>

            <div className="relative z-10 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiUsers className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Create New User</h2>
                  <p className="text-blue-100 text-sm">Add a new team member to your organization</p>
                </div>
              </div>

              {/* Close button */}
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 mt-4">
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-white to-blue-100"
                  style={{ width: `${formProgress}%` }}
                  animate={{ width: `${formProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-blue-100">Form Progress</span>
                <span className="text-xs text-blue-100 font-medium">{Math.round(formProgress)}%</span>
              </div>
            </div>
          </div>

          {/* Modal Body - Scrollable Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Avatar Section */}
              <motion.div
                variants={itemVariants}
                className="flex justify-center"
              >
                <div className="relative inline-block">
                  <motion.div
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg"
                    animate={controls}
                  >
                    {isGeneratingAvatar ? (
                      <motion.div
                        className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-200 to-indigo-200"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <FiRefreshCw className="w-8 h-8 text-blue-600" />
                      </motion.div>
                    ) : avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <FiUser className="w-12 h-12 text-blue-400" />
                    )}
                  </motion.div>

                  <motion.button
                    type="button"
                    onClick={generateRandomAvatar}
                    className="absolute bottom-0 right-0 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
                    whileHover={{ scale: 1.2, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiShield className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Responsive Form Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information Column */}
                <motion.div variants={itemVariants} className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiUser className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </h3>

                  {/* Name Field */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className={`h-5 w-5 transition-colors ${
                          validationState.name === 'valid' ? 'text-green-500' :
                          validationState.name === 'invalid' ? 'text-red-500' : 'text-gray-400'
                        }`} />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField('name')}
                        onBlur={() => setActiveField(null)}
                        className={`w-full pl-10 pr-3 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-white border ${
                          activeField === 'name' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        } text-gray-900 placeholder-gray-500`}
                        placeholder="Enter full name"
                      />
                      {validationState.name === 'valid' && (
                        <motion.div
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <FiCheck className="h-5 w-5 text-green-500" />
                        </motion.div>
                      )}
                    </div>
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1 flex items-center gap-2"
                      >
                        <FiX className="w-4 h-4" />
                        {errors.name}
                      </motion.p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className={`h-5 w-5 transition-colors ${
                          validationState.email === 'valid' ? 'text-green-500' :
                          validationState.email === 'invalid' ? 'text-red-500' : 'text-gray-400'
                        }`} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField('email')}
                        onBlur={() => setActiveField(null)}
                        className={`w-full pl-10 pr-3 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-white border ${
                          activeField === 'email' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        } text-gray-900 placeholder-gray-500`}
                        placeholder="Enter email address"
                      />
                    </div>

                    {/* Email Suggestions */}
                    <AnimatePresence>
                      {showEmailSuggestions && emailSuggestions.length > 0 && (
                        <motion.div
                          className="absolute z-40 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          {emailSuggestions.map((suggestion, index) => (
                            <motion.button
                              key={index}
                              type="button"
                              onClick={() => selectEmailSuggestion(suggestion)}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors text-gray-800 text-sm"
                              whileHover={{ x: 5 }}
                            >
                              <FiMail className="inline mr-2 text-blue-600" />
                              {suggestion}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1 flex items-center gap-2"
                      >
                        <FiX className="w-4 h-4" />
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSmartphone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField('phone')}
                        onBlur={() => setActiveField(null)}
                        className={`w-full pl-10 pr-3 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-white border ${
                          activeField === 'phone' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        } text-gray-900 placeholder-gray-500`}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    {errors.phone && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1 flex items-center gap-2"
                      >
                        <FiX className="w-4 h-4" />
                        {errors.phone}
                      </motion.p>
                    )}
                  </div>

                  {/* Role Field */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiShield className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-white border border-gray-300 text-gray-900"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  {/* Team Field */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUsers className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="team_id"
                        value={formData.team_id || ''}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-white border border-gray-300 text-gray-900"
                      >
                        <option value="">No Team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>

                {/* Security Column */}
                <motion.div variants={itemVariants} className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiLock className="w-5 h-5 text-blue-600" />
                    Security
                  </h3>

                  {/* Password Field */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className={`h-5 w-5 transition-colors ${
                          validationState.password === 'valid' ? 'text-green-500' :
                          validationState.password === 'invalid' ? 'text-red-500' : 'text-gray-400'
                        }`} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField('password')}
                        onBlur={() => setActiveField(null)}
                        className={`w-full pl-10 pr-12 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-white border ${
                          activeField === 'password' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        } text-gray-900 placeholder-gray-500`}
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <FiEyeOff className="h-5 w-5" />
                        ) : (
                          <FiEye className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <motion.div
                        className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-600">Password Strength</span>
                          <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                            {strengthInfo.emoji} {strengthInfo.text}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${getPasswordStrengthColor(passwordStrength)}`}
                            style={{ width: `${passwordStrength}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${passwordStrength}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {passwordStrength < 25 && "• Use at least 6 characters"}
                          {passwordStrength >= 25 && passwordStrength < 50 && "• Add uppercase and lowercase letters"}
                          {passwordStrength >= 50 && passwordStrength < 75 && "• Include numbers and special characters"}
                          {passwordStrength >= 75 && "• Excellent password strength!"}
                        </div>
                      </motion.div>
                    )}

                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1 flex items-center gap-2"
                      >
                        <FiX className="w-4 h-4" />
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className={`h-5 w-5 transition-colors ${
                          validationState.confirmPassword === 'valid' ? 'text-green-500' :
                          validationState.confirmPassword === 'invalid' ? 'text-red-500' : 'text-gray-400'
                        }`} />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField('confirmPassword')}
                        onBlur={() => setActiveField(null)}
                        className={`w-full pl-10 pr-12 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-white border ${
                          activeField === 'confirmPassword' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        } text-gray-900 placeholder-gray-500`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <FiEyeOff className="h-5 w-5" />
                        ) : (
                          <FiEye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {validationState.confirmPassword === 'valid' && (
                      <motion.div
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <FiCheck className="h-5 w-5 text-green-500" />
                      </motion.div>
                    )}
                    {errors.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1 flex items-center gap-2"
                      >
                        <FiX className="w-4 h-4" />
                        {errors.confirmPassword}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Enhanced Create User Button */}
              <motion.div
                variants={itemVariants}
                className="flex justify-center pt-6"
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  <div className="relative z-10 flex items-center gap-3">
                    {loading ? (
                      <>
                        <motion.div
                          className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Creating User...</span>
                      </>
                    ) : (
                      <>
                        <motion.div
                          className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <FiUsers className="w-5 h-5" />
                        </motion.div>
                        <span>Create User</span>
                        <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </div>

                  {/* Enhanced Animated background effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '0%' }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />

                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
                  />
                </motion.button>
              </motion.div>
            </form>
          </div>
        </motion.div>

        {/* Success Overlay */}
        <AnimatePresence>
          {showSuccessAnimation && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-60 rounded-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-center p-8"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.8, type: "spring" }}
              >
                <motion.div
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <FiCheck className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Success!</h3>
                <p className="text-gray-600 mb-4">User created successfully</p>
                {countdown && (
                  <p className="text-sm text-gray-500">Closing in {countdown}...</p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Toast Notification */}
      <GlassmorphicToast
        type={toast.type}
        message={toast.message}
        description={toast.description}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={5000}
      />
    </AnimatePresence>
  );
};

export default CreateUser;