import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMail, FiPhone, FiLinkedin, FiSlack, FiCalendar,
    FiEdit2, FiSave, FiX, FiCamera, FiBriefcase, FiUser,
    FiUsers, FiFolder, FiClock, FiMessageSquare, FiCheckCircle,
    FiAlertCircle, FiExternalLink, FiGithub, FiMapPin
} from 'react-icons/fi';
import { useUserProfile } from '../hooks/useUserProfile';
import { supabase } from '../supabaseClient';
import LoadingSpinner from './shared/LoadingSpinner';

// --- Animation Variants ---
const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, rotateX: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        rotateX: 0,
        transition: { type: "spring", stiffness: 300, damping: 25, mass: 0.8 }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.2 }
    }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
};

const tabContentVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, filter: 'blur(10px)', transition: { duration: 0.2 } }
};

// --- Liquid Background Component ---
const LiquidBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                x: [0, 50, 0],
                y: [0, -30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[20%] w-[70%] h-[70%] bg-indigo-500/30 rounded-full blur-[100px]"
        />
        <motion.div
            animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -60, 0],
                x: [0, -40, 0],
                y: [0, 40, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] bg-purple-500/30 rounded-full blur-[100px]"
        />
        <motion.div
            animate={{
                scale: [1, 1.4, 1],
                x: [0, 30, 0],
                y: [0, 30, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-cyan-500/20 rounded-full blur-[100px]"
        />
    </div>
);

const UserProfileInfoModal = ({ isOpen, onClose, userId, onStartChat }) => {
    const { profile, loading, saving, error, isOwnProfile, updateProfile } = useUserProfile(userId);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [activeTab, setActiveTab] = useState('about');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // Additional Data
    const [manager, setManager] = useState(null);
    const [projects, setProjects] = useState([]);
    const [team, setTeam] = useState(null);
    const [leaveStatus, setLeaveStatus] = useState(null);
    const [loadingExtras, setLoadingExtras] = useState(true);

    useEffect(() => {
        if (profile) {
            setFormData(profile);
            fetchAdditionalData();
        }
    }, [profile]);

    // --- Data Fetching ---
    const fetchAdditionalData = async () => {
        if (!profile?.id) return;
        setLoadingExtras(true);
        try {
            const [managerData, projectsData, teamData, leaveData] = await Promise.all([
                fetchManager(profile.id),
                fetchProjects(profile.id),
                fetchTeam(profile.team_id),
                fetchLeaveStatus(profile.id)
            ]);
            setManager(managerData);
            setProjects(projectsData);
            setTeam(teamData);
            setLeaveStatus(leaveData);
        } catch (err) {
            console.error('Error fetching additional data:', err);
        } finally {
            setLoadingExtras(false);
        }
    };

    const fetchManager = async (userId) => {
        try {
            const { data: userData } = await supabase.from('users').select('manager_id').eq('id', userId).single();
            if (!userData?.manager_id) return null;
            const { data: managerData } = await supabase.from('users').select('id, name, avatar_url, email, job_title').eq('id', userData.manager_id).single();
            return managerData;
        } catch (err) { return null; }
    };

    const fetchProjects = async (userId) => {
        try {
            const { data } = await supabase.from('project_assignments').select('role_in_project, projects(id, name, status, description)').eq('user_id', userId).limit(10);
            return data?.map(item => ({ ...item.projects, role: item.role_in_project })) || [];
        } catch (err) { return []; }
    };

    const fetchTeam = async (teamId) => {
        if (!teamId) return null;
        try {
            const { data } = await supabase.from('teams').select('id, name').eq('id', teamId).single();
            return data;
        } catch (err) { return null; }
    };

    const fetchLeaveStatus = async (userId) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase.from('leave_plans').select('start_date, end_date, status').eq('user_id', userId).eq('status', 'approved').lte('start_date', today).gte('end_date', today).maybeSingle();
            return data;
        } catch (err) { return null; }
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

    if (!isOpen) return null;

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 font-sans">
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />

                    <motion.div
                        className="relative w-full max-w-2xl min-h-[600px] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-white/10 backdrop-filter backdrop-blur-xl"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        <LiquidBackground />

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center z-10">
                                <LoadingSpinner />
                            </div>
                        ) : error ? (
                            <div className="flex-1 flex items-center justify-center z-10 p-8 text-center text-red-200">
                                <div className="bg-red-500/20 px-6 py-4 rounded-xl border border-red-500/30 backdrop-blur-md">
                                    Error: {error}
                                </div>
                            </div>
                        ) : profile ? (
                            <div className="relative z-10 flex flex-col h-full">
                                {/* --- Glass Header --- */}
                                <div className="flex justify-between items-start p-6 pb-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={onClose}
                                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors backdrop-blur-md"
                                        >
                                            <FiX className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        {!isOwnProfile && (
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    if (onStartChat) onStartChat(profile);
                                                    else window.location.href = '/chat';
                                                }}
                                                className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-100 border border-indigo-500/30 backdrop-blur-md transition-all flex items-center gap-2 text-sm font-medium"
                                            >
                                                <FiMessageSquare className="w-4 h-4" /> Message
                                            </button>
                                        )}
                                        {isOwnProfile && !isEditing && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 text-sm font-medium"
                                            >
                                                <FiEdit2 className="w-4 h-4" /> Edit
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                onClose();
                                                window.location.href = `/profile/${profile.id}`;
                                            }}
                                            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 backdrop-blur-md transition-colors border border-white/10"
                                            title="View Full Profile"
                                        >
                                            <FiExternalLink className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* --- Profile Hero --- */}
                                <div className="px-8 pt-4 pb-8 flex flex-col items-center sm:flex-row sm:items-end gap-6">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-[2rem] p-1 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md shadow-2xl">
                                            <div className="w-full h-full rounded-[1.8rem] overflow-hidden relative">
                                                {formData.avatar_url ? (
                                                    <img src={formData.avatar_url} alt={formData.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-indigo-900/40 text-indigo-200">
                                                        <FiUser className="w-12 h-12" />
                                                    </div>
                                                )}
                                                {isEditing && (
                                                    <div
                                                        className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <FiCamera className="w-8 h-8 text-white/90" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />

                                        {/* Status Pill */}
                                        <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:-right-2 px-3 py-1 rounded-full text-xs font-bold border border-white/20 shadow-lg backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap ${leaveStatus ? 'bg-amber-500/20 text-amber-200' : 'bg-emerald-500/20 text-emerald-200'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${leaveStatus ? 'bg-amber-400' : 'bg-emerald-400'} shadow-[0_0_8px_currentColor]`} />
                                            {leaveStatus ? 'On Leave' : 'Available'}
                                        </div>
                                    </div>

                                    <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <input
                                                    name="name"
                                                    value={formData.name || ''}
                                                    onChange={handleInputChange}
                                                    className="text-3xl font-bold text-white bg-white/10 border border-white/20 rounded-xl px-4 py-2 w-full focus:bg-white/20 outline-none backdrop-blur-sm placeholder-white/30"
                                                    placeholder="Full Name"
                                                />
                                                <input
                                                    name="job_title"
                                                    value={formData.job_title || ''}
                                                    onChange={handleInputChange}
                                                    className="text-lg text-indigo-200 bg-white/10 border border-white/20 rounded-xl px-4 py-2 w-full focus:bg-white/20 outline-none backdrop-blur-sm placeholder-white/30"
                                                    placeholder="Job Title"
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <h2 className="text-4xl font-bold text-white drop-shadow-md tracking-tight">{profile.name}</h2>
                                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 text-indigo-200/80 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <FiBriefcase className="w-4 h-4 text-indigo-400" />
                                                        <span>{profile.job_title || 'Team Member'}</span>
                                                    </div>
                                                    {team && (
                                                        <>
                                                            <span className="hidden sm:inline text-white/20">•</span>
                                                            <span className="text-white/60 bg-white/10 px-2 py-0.5 rounded-md text-xs">{team.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* --- Tabs --- */}
                                <div className="px-8 mt-2">
                                    <div className="flex p-1 bg-black/20 rounded-2xl backdrop-blur-sm overflow-x-auto">
                                        {['about', 'projects', 'team'].map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className="relative flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all z-0"
                                            >
                                                {activeTab === tab && (
                                                    <motion.div
                                                        layoutId="activeTab"
                                                        className="absolute inset-0 bg-white/15 rounded-xl shadow-inner border border-white/10 backdrop-blur-md"
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    />
                                                )}
                                                <span className={`relative z-10 ${activeTab === tab ? 'text-white' : 'text-white/60 hover:text-white/80'}`}>
                                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* --- Scrolling Content Area --- */}
                                <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'about' && (
                                            <motion.div key="about" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                                                {/* Bio Card */}
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-sm relative overflow-hidden group hover:bg-white/10 transition-colors">
                                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                        <FiUser className="w-16 h-16" />
                                                    </div>
                                                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_currentColor]"></span>
                                                        Biography
                                                    </h3>
                                                    {isEditing ? (
                                                        <textarea
                                                            name="bio"
                                                            value={formData.bio || ''}
                                                            onChange={handleInputChange}
                                                            rows={4}
                                                            className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white/90 focus:bg-black/30 outline-none backdrop-blur-md placeholder-white/20 resize-none"
                                                            placeholder="Write a short bio..."
                                                        />
                                                    ) : (
                                                        <p className="text-white/80 leading-relaxed font-light text-sm">
                                                            {profile.bio || "No bio information provided."}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Contact Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <ContactGlassItem icon={FiMail} label="Email" value={profile.email} />
                                                    <ContactGlassItem icon={FiPhone} label="Phone" value={formData.phone} isEditing={isEditing} name="phone" onChange={handleInputChange} placeholder="+1..." />
                                                    <ContactGlassItem icon={FiSlack} label="Slack" value={formData.slack_handle} isEditing={isEditing} name="slack_handle" onChange={handleInputChange} placeholder="@username" />
                                                    <ContactGlassItem icon={FiLinkedin} label="LinkedIn" value={formData.linkedin_url} isEditing={isEditing} name="linkedin_url" onChange={handleInputChange} placeholder="URL" isLink />
                                                    <ContactGlassItem icon={FiCalendar} label="Joined" value={formData.start_date} isEditing={isEditing} name="start_date" onChange={handleInputChange} type="date" />
                                                </div>

                                                {/* Manager Card */}
                                                {manager && (
                                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm shadow-sm hover:bg-white/10 transition-colors">
                                                        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_currentColor]"></span>
                                                            Reporting To
                                                        </h3>
                                                        <div className="flex items-center gap-4">
                                                            <img src={manager.avatar_url} alt={manager.name} className="w-12 h-12 rounded-xl object-cover bg-white/10 border border-white/20" />
                                                            <div>
                                                                <div className="text-white font-bold">{manager.name}</div>
                                                                <div className="text-sm text-white/50">{manager.job_title || 'Manager'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {activeTab === 'projects' && (
                                            <motion.div key="projects" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-3">
                                                {projects.length > 0 ? (
                                                    projects.map((project, i) => (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: i * 0.05 }}
                                                            key={project.id}
                                                            className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-all group"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">{project.name}</h4>
                                                                    <p className="text-xs text-white/50 mt-1 line-clamp-1">{project.description || 'No description'}</p>
                                                                </div>
                                                                <span className={`px-2 py-1 text-[10px] font-bold rounded-lg border backdrop-blur-md ${project.status === 'active' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' : 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                                                                    {project.status.toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div className="mt-4 flex items-center gap-2 text-xs">
                                                                <div className="bg-white/10 text-indigo-200 px-3 py-1 rounded-lg border border-white/10 font-medium">
                                                                    {project.role || 'Member'}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                                        <FiFolder className="w-12 h-12 mx-auto mb-3 text-white/20" />
                                                        <p className="text-white/40 font-medium">No active projects</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {activeTab === 'team' && (
                                            <motion.div key="team" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                                                {team ? (
                                                    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-8 rounded-3xl border border-white/10 text-center backdrop-blur-md relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay"></div>
                                                        <div className="w-20 h-20 bg-white/10 text-indigo-300 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-lg">
                                                            <FiUsers className="w-10 h-10" />
                                                        </div>
                                                        <h3 className="text-2xl font-bold text-white mb-2">{team.name}</h3>
                                                        <p className="text-white/60 max-w-sm mx-auto leading-relaxed">{team.description || 'No team description available.'}</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                                        <p className="text-white/40 font-medium">No team assigned</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                {isEditing && (
                                    <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/20 backdrop-blur-md">
                                        <button
                                            onClick={() => { setIsEditing(false); setFormData(profile); }}
                                            className="px-5 py-2.5 text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                                        >
                                            Discard Changes
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- Glass Helper Components ---
const ContactGlassItem = ({ icon: Icon, label, value, isEditing, onChange, name, placeholder, type = "text", isLink }) => (
    <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-indigo-300 border border-white/10 shadow-inner">
            <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">{label}</div>
            {isEditing && name ? (
                <input
                    type={type}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    className="w-full text-sm bg-black/20 border-b border-white/20 focus:border-indigo-400 outline-none py-1 text-white placeholder-white/20 transition-colors"
                    placeholder={placeholder}
                />
            ) : (
                <div className="text-sm font-medium text-white/90 truncate">
                    {isLink && value ? (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-white transition-colors underline decoration-indigo-300/30 underline-offset-4">
                            {value.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                    ) : (
                        value || <span className="text-white/20 italic">Not set</span>
                    )}
                </div>
            )}
        </div>
    </div>
);

export default UserProfileInfoModal;
