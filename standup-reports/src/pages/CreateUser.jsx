import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import {
  FiUser, FiMail, FiLock, FiShield, FiBriefcase, FiCheck, FiX,
  FiArrowRight, FiArrowLeft, FiSmartphone, FiGrid, FiLayers, FiRefreshCw
} from 'react-icons/fi';
import GlassmorphicToast from '../components/GlassmorphicToast';

const AVATAR_URLS = [
  'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/6ACAFD4D-DA6A-4FE8-A482-CEF6299AF104_1_105_c.jpeg',
  'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/B94AFE2E-5D15-46F6-9EEB-7571975A8F14_1_105_c.jpeg',
  'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/C40EFEF2-6233-4834-B85C-64CCC37009BB_1_105_c.jpeg',
  'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/DA17C16A-2DF0-4F20-A3FB-A2EF13E4C98B_1_105_c.jpeg',
  'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/DDC03DE1-2A2A-4906-838F-D422C1D0B0CC_1_105_c.jpeg',
  'https://zfyxudmjeytmdtigxmfc.supabase.co/storage/v1/object/public/avatars/EDCED201-8799-4A1F-9B91-ACF8D65F0DE0_1_105_c.jpeg'
];

const CreateUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentCompany } = useCompany();

  // State
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(AVATAR_URLS[0]);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'member',
    team_id: '',
    teamName: '',
    department: '',
    position: '',
    password: '',
    confirmPassword: ''
  });

  const [toast, setToast] = useState({ isVisible: false, type: 'success', message: '', description: '' });

  // Effects
  useEffect(() => {
    fetchTeams();
    selectRandomAvatar();
  }, [currentCompany]);

  const fetchTeams = async () => {
    if (!currentCompany?.id) return;
    const { data } = await supabase.from('teams').select('*').eq('company_id', currentCompany.id);
    setTeams(data || []);
  };

  const handleClose = () => {
    if (location.state?.background) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectRandomAvatar = () => {
    const random = AVATAR_URLS[Math.floor(Math.random() * AVATAR_URLS.length)];
    setAvatarPreview(random);
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass, confirmPassword: pass }));
  };

  const steps = [
    {
      id: 'identity',
      title: "Who are we welcoming?",
      subtitle: "Let's start with their name and a friendly face.",
      isValid: () => formData.name.length > 0,
      component: (
        <div className="space-y-8">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <motion.div
                className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-xl cursor-pointer relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAvatarSelector(!showAvatarSelector)}
              >
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium">Change</span>
                </div>
              </motion.div>
              <motion.button
                className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-600"
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectRandomAvatar();
                }}
              >
                <FiRefreshCw className="w-4 h-4" />
              </motion.button>
            </div>

            <AnimatePresence>
              {showAvatarSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-3 overflow-x-auto p-2 max-w-full"
                >
                  {AVATAR_URLS.map((url, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        setAvatarPreview(url);
                        setShowAvatarSelector(false);
                      }}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 flex-shrink-0 ${avatarPreview === url ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'}`}
                      whileHover={{ scale: 1.1 }}
                    >
                      <img src={url} alt={`Option ${index}`} className="w-full h-full object-cover" />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full max-w-md">
              <label className="block text-sm font-medium text-gray-500 mb-2 text-center uppercase tracking-wide">Full Name</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Sarah Connor"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full text-center text-3xl font-bold text-gray-900 placeholder-gray-300 border-b-2 border-gray-200 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'contact',
      title: "How can we reach them?",
      subtitle: "Set up their digital contact points.",
      isValid: () => formData.email.includes('@'),
      component: (
        <div className="space-y-8 w-full max-w-md mx-auto">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                autoFocus
                type="email"
                placeholder="sarah@company.com"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full pl-10 text-xl font-medium text-gray-900 placeholder-gray-300 border-b-2 border-gray-200 focus:border-blue-500 outline-none py-3 bg-transparent transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Phone Number <span className="text-gray-300 normal-case">(Optional)</span></label>
            <div className="relative">
              <FiSmartphone className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full pl-10 text-xl font-medium text-gray-900 placeholder-gray-300 border-b-2 border-gray-200 focus:border-blue-500 outline-none py-3 bg-transparent transition-colors"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'role',
      title: "What is their role?",
      subtitle: "Define their access level within the system.",
      isValid: () => true,
      component: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mx-auto">
          {[
            { id: 'member', label: 'Member', desc: 'Standard access to assigned projects and tasks.', icon: FiUser },
            { id: 'manager', label: 'Manager', desc: 'Can manage teams, projects, and view reports.', icon: FiBriefcase },
            { id: 'admin', label: 'Admin', desc: 'Full system access and configuration control.', icon: FiShield }
          ].map((role) => (
            <motion.button
              key={role.id}
              onClick={() => updateField('role', role.id)}
              className={`p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${formData.role === role.id ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${formData.role === role.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <role.icon className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold mb-1 ${formData.role === role.id ? 'text-blue-900' : 'text-gray-900'}`}>{role.label}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{role.desc}</p>

              {formData.role === role.id && (
                <motion.div
                  layoutId="role-check"
                  className="absolute top-4 right-4 text-blue-500"
                >
                  <FiCheck className="w-6 h-6" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      )
    },
    {
      id: 'team',
      title: "Where do they belong?",
      subtitle: "Assign them to a team and department.",
      isValid: () => true,
      component: (
        <div className="space-y-8 w-full max-w-md mx-auto">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Job Title</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Product Designer"
              value={formData.position}
              onChange={(e) => updateField('position', e.target.value)}
              className="w-full text-xl font-medium text-gray-900 placeholder-gray-300 border-b-2 border-gray-200 focus:border-blue-500 outline-none py-3 bg-transparent transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Department</label>
              <div className="relative">
                <FiLayers className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none text-lg text-gray-900 appearance-none cursor-pointer"
                >
                  <option value="">Select...</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Product">Product</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Team</label>
              <div className="relative">
                <FiGrid className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.team_id}
                  onChange={(e) => {
                    const team = teams.find(t => t.id === e.target.value);
                    updateField('team_id', e.target.value);
                    updateField('teamName', team ? team.name : '');
                  }}
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none text-lg text-gray-900 appearance-none cursor-pointer"
                >
                  <option value="">Select...</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      title: "Secure the account",
      subtitle: "Set a temporary password for their first login.",
      isValid: () => formData.password.length >= 6 && formData.password === formData.confirmPassword,
      component: (
        <div className="space-y-8 w-full max-w-md mx-auto">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
            <p className="text-blue-800 text-sm mb-4">
              We recommend generating a strong random password. The user will be prompted to change it upon first login.
            </p>
            <button
              onClick={generatePassword}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-semibold shadow-sm border border-blue-200 hover:bg-blue-50 transition-colors flex items-center gap-2 mx-auto"
            >
              <FiShield className="w-4 h-4" />
              Generate Secure Password
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Password</label>
              <div className="relative">
                <FiLock className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full pl-8 text-xl font-medium text-gray-900 placeholder-gray-300 border-b-2 border-gray-200 focus:border-blue-500 outline-none py-3 bg-transparent transition-colors font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Confirm Password</label>
              <div className="relative">
                <FiCheck className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="w-full pl-8 text-xl font-medium text-gray-900 placeholder-gray-300 border-b-2 border-gray-200 focus:border-blue-500 outline-none py-3 bg-transparent transition-colors font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Auth SignUp
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
        // 2. Insert into users table
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            company_id: currentCompany.id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            team_id: formData.team_id || null,
            avatar_url: avatarPreview
          }, { onConflict: ['id'] });

        if (userError) throw userError;

        // 3. Insert profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: authData.user.id,
            phone: formData.phone,
            avatar_url: avatarPreview
          }]);

        if (profileError) throw profileError;

        showToast('success', 'User Created', 'The user has been successfully added.');
        setTimeout(handleClose, 1500);
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'Creation Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, message, description) => {
    setToast({ isVisible: true, type, message, description });
  };

  const currentStep = steps[step];

  // Check Limits
  const checkLimits = async () => {
    if (!currentCompany?.id) return;

    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('company_id', currentCompany.id)
      .eq('status', 'active')
      .single();

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', currentCompany.id);

    const maxUsers = subData?.plan?.max_users;
    // If maxUsers is null, it's unlimited. If it's a number, check count.
    if (maxUsers && count >= maxUsers) {
      setLimitReached(true);
    }
  };

  useEffect(() => {
    checkLimits();
  }, [currentCompany]);

  const [limitReached, setLimitReached] = useState(false);

  // If Limit Reached, show blocking UI
  if (limitReached) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleClose}
          />
          <motion.div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShield className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Limit Reached</h2>
            <p className="text-gray-500 mb-8">
              Your current plan has reached its maximum number of users. Upgrade your subscription to add more team members.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleClose}
                className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/subscription')}
                className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
              >
                Upgrade Plan
                <FiArrowRight />
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        />

        {/* Focus Card */}
        <motion.div
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[600px] max-h-[90vh]"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.2 }}
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
            <motion.div
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Header */}
          <div className="px-8 py-6 flex justify-between items-center z-20">
            <div className="text-sm font-medium text-gray-400">
              Step {step + 1} of {steps.length}
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-3xl"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                  {currentStep.title}
                </h2>
                <p className="text-lg text-gray-500 mb-12 font-light">
                  {currentStep.subtitle}
                </p>

                <div className="w-full flex justify-center">
                  {currentStep.component}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center z-20">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 ${step === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200/50'}`}
            >
              <FiArrowLeft className="w-5 h-5" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!currentStep.isValid() || loading}
              className={`px-10 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center gap-3 ${!currentStep.isValid() || loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 hover:shadow-xl'}`}
            >
              {loading ? (
                <>
                  <FiRefreshCw className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : step === steps.length - 1 ? (
                <>
                  Create User
                  <FiCheck className="w-5 h-5" />
                </>
              ) : (
                <>
                  Continue
                  <FiArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </motion.div>

        <GlassmorphicToast
          type={toast.type}
          message={toast.message}
          description={toast.description}
          isVisible={toast.isVisible}
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        />
      </div>
    </AnimatePresence>
  );
};

export default CreateUser;