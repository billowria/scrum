import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { FiAward, FiSave, FiUserPlus, FiX, FiCheck, FiCamera, FiSearch, FiInfo, FiTrendingUp, FiZap } from 'react-icons/fi';
import { notifyAchievement } from '../utils/notificationHelper';
import { useTheme } from '../context/ThemeContext';

// Animation variants
const formVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 }
  }
};

const AchievementForm = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [awardType, setAwardType] = useState('recognition');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const { themeMode, isAnimatedTheme } = useTheme();

  // Award type options
  const awardTypeOptions = [
    { value: 'promotion', label: 'Promotion' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'recognition', label: 'Recognition' },
    { value: 'performance', label: 'Performance' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'teamwork', label: 'Teamwork' },
    { value: 'achievement', label: 'Achievement' },
    { value: 'special', label: 'Special Award' },
    { value: 'technical', label: 'Technical Excellence' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch users when the form opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    } else {
      // Reset form on close
      setTitle('');
      setDescription('');
      setSelectedUser(null);
      setSearchTerm('');
      setMessage({ type: '', text: '' });
      setPhoto(null);
      setPhotoPreview(null);
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, role')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle photo upload
  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 2MB' });
        return;
      }

      setPhoto(file);

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !selectedUser) {
      setMessage({ type: 'error', text: 'Please fill in required fields' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Get current user's company_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // 2. Upload photo if exists
      let imageUrl = null;
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `achievements/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // 3. Create achievement
      const { data: achievement, error: achievementError } = await supabase
        .from('achievements')
        .insert({
          title,
          description,
          award_type: awardType,
          user_id: selectedUser.id,
          created_by: user.id,
          company_id: userData.company_id,
          image_url: imageUrl,
          awarded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (achievementError) throw achievementError;

      // 4. Send notification
      await notifyAchievement(achievement.id, selectedUser.id);

      setMessage({ type: 'success', text: 'Achievement posted successfully!' });
      setTimeout(() => {
        onSuccess(achievement);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error creating achievement:', error.message);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Form Modal */}
          <motion.div
            className={`relative w-full max-w-xl ${isAnimatedTheme ? 'bg-transparent' : 'bg-slate-900'} ${!isAnimatedTheme ? 'backdrop-blur-xl' : ''} border border-white/10 rounded-[2.5rem] shadow-3xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-700`}
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Ambient background glows */}
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-600/10 blur-3xl`} />
            <div className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-rose-500/10 to-indigo-600/10 blur-3xl`} />

            {/* Header */}
            <div className="p-8 pb-4 relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                    <FiAward className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white leading-none tracking-tight">Create Achievement</h2>
                    <p className="text-white/40 text-xs font-black uppercase tracking-widest mt-1 italic">Official Sync Broadcast</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center border border-white/5 transition-all"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border ${message.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      } text-sm font-bold flex items-center gap-2`}
                  >
                    {message.type === 'error' ? <FiInfo /> : <FiCheck />}
                    {message.text}
                  </motion.div>
                )}

                {/* Recipient Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">Target Recipient</label>
                  {!selectedUser ? (
                    <div className="relative group">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="text"
                        placeholder="Search team members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-bold"
                      />
                      {searchTerm && filteredUsers.length > 0 && (
                        <motion.div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-3xl z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                          {filteredUsers.map(user => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => setSelectedUser(user)}
                              className="w-full text-left p-4 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 last:border-none"
                            >
                              {user.avatar_url ? (
                                <img src={user.avatar_url} className="w-10 h-10 rounded-xl object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 font-black italic">{user.name[0]}</div>
                              )}
                              <div>
                                <p className="text-sm font-bold text-white leading-none mb-1">{user.name}</p>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{user.role || 'Member'}</p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      layout
                      className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {selectedUser.avatar_url ? (
                          <img src={selectedUser.avatar_url} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black italic">{selectedUser.name[0]}</div>
                        )}
                        <div>
                          <p className="text-base font-black text-white leading-none mb-1">{selectedUser.name}</p>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{selectedUser.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                      >
                        <FiX />
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Achievement Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="award-type" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">Award Type</label>
                    <div className="relative">
                      <select
                        id="award-type"
                        value={awardType}
                        onChange={(e) => setAwardType(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 font-bold appearance-none transition-all cursor-pointer"
                      >
                        {awardTypeOptions.map(option => (
                          <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <FiZap className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">Achievement Title</label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Q4 Performance Leader"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-bold placeholder:text-white/10"
                      required
                    />
                  </div>
                </div>

                {/* Citation */}
                <div className="space-y-2">
                  <label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">Citation & Description</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the achievement and its impact..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-bold min-h-[120px] placeholder:text-white/10"
                  />
                </div>

                {/* Visual Proof */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">Visual Asset (Optional)</label>
                  <div className="flex items-center gap-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
                    {photoPreview ? (
                      <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-white/20 group">
                        <img src={photoPreview} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10 text-white/20 group-hover:text-white/40 transition-colors">
                        <FiCamera size={32} />
                      </div>
                    )}
                    <div className="flex-1">
                      <label htmlFor="photo-upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest cursor-pointer border border-white/10 transition-all">
                        <FiSave className="w-3.5 h-3.5" />
                        Upload Reference
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <p className="mt-2 text-[10px] text-white/20 font-bold italic">High-res PNG or JPG (Max 2MB)</p>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-950/40 border-t border-white/5 flex gap-4 relative z-10">
              <motion.button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black uppercase tracking-widest border border-white/10 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                Dismiss
              </motion.button>
              <motion.button
                type="submit"
                onClick={handleSubmit}
                className={`flex-[2] py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading || !title || !selectedUser}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiTrendingUp className="w-5 h-5" />
                    Broadcast Achievement
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementForm; 