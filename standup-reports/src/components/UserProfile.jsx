import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail, FiPhone, FiLinkedin, FiSlack, FiCalendar,
  FiEdit2, FiSave, FiX, FiCamera, FiBriefcase, FiUser,
  FiCheckCircle, FiTarget, FiAward, FiTrendingUp, FiMapPin, FiGlobe,
  FiGithub, FiTwitter, FiLayers, FiUsers, FiStar, FiZap, FiCpu, FiGift
} from 'react-icons/fi';
import { useUserProfile } from '../hooks/useUserProfile';
import { supabase } from '../supabaseClient';
import LoadingSpinner from './shared/LoadingSpinner';

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const UserProfile = () => {
  const { userId } = useParams();
  const { profile, loading, saving, error, isOwnProfile, updateProfile } = useUserProfile(userId);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Stats & Data
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    activeProjects: 0,
    reportsSubmitted: 0,
    streak: 0
  });
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
      fetchAdditionalData();
    }
  }, [profile]);

  const fetchAdditionalData = async () => {
    if (!profile?.id) return;
    setLoadingExtras(true);
    try {
      const [statsData, projectsData, teamData, achievementsData] = await Promise.all([
        fetchStats(profile.id),
        fetchProjects(profile.id),
        fetchTeam(profile.team_id),
        fetchAchievements(profile.id)
      ]);

      setStats(statsData);
      setProjects(projectsData);
      setTeam(teamData);
      setAchievements(achievementsData);
    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoadingExtras(false);
    }
  };

  const fetchStats = async (uid) => {
    // 1. Tasks Completed
    const { count: tasksCompleted } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assignee_id', uid)
      .eq('status', 'Completed');

    // 2. Active Projects (from assignments)
    const { count: activeProjects } = await supabase
      .from('project_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid);

    // 3. Reports Submitted
    const { count: reportsSubmitted } = await supabase
      .from('daily_reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid);

    return {
      tasksCompleted: tasksCompleted || 0,
      activeProjects: activeProjects || 0,
      reportsSubmitted: reportsSubmitted || 0,
      streak: Math.floor(Math.random() * 10) + 1 // Mock streak for now
    };
  };

  const fetchProjects = async (uid) => {
    const { data } = await supabase
      .from('project_assignments')
      .select('role_in_project, projects(id, name, status, description)')
      .eq('user_id', uid)
      .limit(5);
    return data?.map(item => ({ ...item.projects, role: item.role_in_project })) || [];
  };

  const fetchTeam = async (tid) => {
    if (!tid) return null;
    const { data } = await supabase
      .from('teams')
      .select('id, name, description')
      .eq('id', tid)
      .single();
    return data;
  };

  const fetchAchievements = async (uid) => {
    const { data } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', uid)
      .order('awarded_at', { ascending: false });
    return data || [];
  };

  const getAchievementStyle = (type) => {
    switch (type) {
      case 'promotion': return { icon: FiTrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'certificate': return { icon: FiAward, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'recognition': return { icon: FiStar, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'performance': return { icon: FiZap, color: 'text-amber-600', bg: 'bg-amber-100' };
      case 'milestone': return { icon: FiTarget, color: 'text-red-600', bg: 'bg-red-100' };
      case 'teamwork': return { icon: FiUsers, color: 'text-indigo-600', bg: 'bg-indigo-100' };
      case 'technical': return { icon: FiCpu, color: 'text-slate-600', bg: 'bg-slate-100' };
      default: return { icon: FiGift, color: 'text-emerald-600', bg: 'bg-emerald-100' };
    }
  };

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const success = await updateProfile(formData);
    if (success) setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      await supabase.storage.from('avatars').upload(filePath, file);
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
    } catch (error) { console.error('Error uploading avatar:', error); }
    finally { setUploadingAvatar(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* --- Hero Section --- */}
      <div className="relative h-80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-12 relative z-10">
          <div className="flex flex-col md:flex-row items-end gap-8 w-full">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-40 h-40 rounded-3xl border-4 border-white shadow-2xl overflow-hidden bg-white">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400"><FiUser className="w-16 h-16" /></div>
                )}
                {isEditing && (
                  <div
                    className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiCamera className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
            </div>

            {/* Info */}
            <div className="flex-1 mb-2 text-white">
              {isEditing ? (
                <div className="space-y-3 max-w-md">
                  <input
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className="text-4xl font-bold bg-white/10 border border-white/20 rounded-lg px-3 py-1 w-full text-white placeholder-white/50 focus:bg-white/20 outline-none backdrop-blur-sm"
                    placeholder="Full Name"
                  />
                  <input
                    name="job_title"
                    value={formData.job_title || ''}
                    onChange={handleInputChange}
                    className="text-xl bg-white/10 border border-white/20 rounded-lg px-3 py-1 w-full text-white/90 placeholder-white/50 focus:bg-white/20 outline-none backdrop-blur-sm"
                    placeholder="Job Title"
                  />
                </div>
              ) : (
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">{profile.name}</h1>
                  <div className="flex items-center gap-3 mt-2 text-indigo-200 text-lg">
                    <FiBriefcase className="w-5 h-5" />
                    <span>{profile.job_title || 'Team Member'}</span>
                    {team && (
                      <>
                        <span className="text-white/20">•</span>
                        <span className="font-medium text-white/90">{team.name}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mb-4 flex gap-3">
              {isOwnProfile && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-white text-slate-900 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-lg flex items-center gap-2"
                >
                  <FiEdit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
              {isEditing && (
                <>
                  <button onClick={handleCancel} className="px-6 py-2.5 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors backdrop-blur-sm">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                    {saving ? 'Saving...' : <><FiSave className="w-4 h-4" /> Save Changes</>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Sidebar (Bio & Contact) */}
          <motion.div
            initial="hidden" animate="visible" variants={containerVariants}
            className="lg:col-span-4 space-y-6"
          >
            {/* Bio Card */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">About</h3>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-600 leading-relaxed">{profile.bio || "No bio information provided."}</p>
              )}
            </motion.div>

            {/* Contact Info */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <ContactItem icon={FiMail} label="Email" value={profile.email} />
                <ContactItem icon={FiPhone} label="Phone" value={formData.phone} isEditing={isEditing} name="phone" onChange={handleInputChange} placeholder="+1..." />
                <ContactItem icon={FiSlack} label="Slack" value={formData.slack_handle} isEditing={isEditing} name="slack_handle" onChange={handleInputChange} placeholder="@username" />
                <ContactItem icon={FiLinkedin} label="LinkedIn" value={formData.linkedin_url} isEditing={isEditing} name="linkedin_url" onChange={handleInputChange} placeholder="URL" isLink />
                <ContactItem icon={FiMapPin} label="Location" value={formData.location || 'Remote'} isEditing={isEditing} name="location" onChange={handleInputChange} placeholder="City, Country" />
              </div>
            </motion.div>

            {/* Skills (Mock) */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {['React', 'JavaScript', 'UI Design', 'Node.js', 'Team Leadership', 'Scrum'].map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content (Stats & Projects) */}
          <div className="lg:col-span-8 space-y-8">

            {/* Stats Row */}
            <motion.div
              initial="hidden" animate="visible" variants={containerVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <StatCard label="Tasks Completed" value={stats.tasksCompleted} icon={FiCheckCircle} color="emerald" delay={0} />
              <StatCard label="Active Projects" value={stats.activeProjects} icon={FiLayers} color="blue" delay={0.1} />
              <StatCard label="Reports Submitted" value={stats.reportsSubmitted} icon={FiCalendar} color="purple" delay={0.2} />
              <StatCard label="Day Streak" value={stats.streak} icon={FiTrendingUp} color="orange" delay={0.3} />
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FiAward className="text-amber-500" /> Achievements
                </h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{achievements.length} Total</span>
              </div>

              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {achievements.map((achievement) => {
                    const style = getAchievementStyle(achievement.award_type);
                    const Icon = style.icon;
                    return (
                      <div key={achievement.id} className={`p-4 rounded-xl border border-gray-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow ${style.bg}/30 group relative overflow-hidden`}>
                        <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center ${style.color} shadow-sm group-hover:scale-110 transition-transform`}>
                          {achievement.image_url ? (
                            <img src={achievement.image_url} alt={achievement.title} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <Icon className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm line-clamp-1" title={achievement.title}>{achievement.title}</div>
                          <div className="text-xs text-gray-500 mt-1 capitalize">{achievement.award_type}</div>
                        </div>
                        {/* Tooltip for description */}
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-xs text-center rounded-xl backdrop-blur-sm">
                          {achievement.description || 'No description'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FiAward className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No achievements yet</p>
                </div>
              )}
            </motion.div>

            {/* Active Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiBriefcase className="text-indigo-500" /> Active Projects
              </h3>
              <div className="space-y-4">
                {projects.length > 0 ? (
                  projects.map((project, idx) => (
                    <div key={project.id} className="group p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{project.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">{project.description || 'No description'}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {project.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                          <span className="bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm">
                            {project.role || 'Member'}
                          </span>
                        </div>
                        <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.random() * 60 + 20}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">No active projects</div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---
const ContactItem = ({ icon: Icon, label, value, isEditing, onChange, name, placeholder, type = "text", isLink }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</div>
      {isEditing && name ? (
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          className="w-full text-sm border-b border-gray-200 focus:border-indigo-500 outline-none py-0.5 bg-transparent"
          placeholder={placeholder}
        />
      ) : (
        <div className="text-sm font-medium text-gray-900 truncate">
          {isLink && value ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
              {value.replace(/^https?:\/\/(www\.)?/, '')}
            </a>
          ) : (
            value || <span className="text-gray-300 italic">Not set</span>
          )}
        </div>
      )}
    </div>
  </div>
);

const StatCard = ({ label, value, icon: Icon, color, delay }) => {
  const colorStyles = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow"
    >
      <div className={`w-10 h-10 rounded-xl ${colorStyles[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs font-medium text-gray-500 mt-1">{label}</div>
    </motion.div>
  );
};

export default UserProfile;
