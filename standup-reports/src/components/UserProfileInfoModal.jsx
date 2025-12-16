import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMail, FiPhone, FiLinkedin, FiSlack, FiCalendar,
    FiEdit2, FiSave, FiX, FiCamera, FiBriefcase, FiUser,
    FiUsers, FiFolder, FiClock, FiMessageSquare, FiCheckCircle,
    FiAlertCircle, FiExternalLink
} from 'react-icons/fi';
import { useUserProfile } from '../hooks/useUserProfile';
import { supabase } from '../supabaseClient';

// --- Animation Variants ---
const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", stiffness: 350, damping: 25 }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 10,
        transition: { duration: 0.2 }
    }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
};

const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

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
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />

                    <motion.div
                        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center h-96">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center text-red-500">Error: {error}</div>
                        ) : profile ? (
                            <>
                                {/* --- Header Banner --- */}
                                <div className="h-32 bg-gradient-to-r from-slate-100 to-slate-200 relative">
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button
                                            onClick={() => {
                                                onClose();
                                                window.location.href = `/profile/${profile.id}`;
                                            }}
                                            className="px-3 py-1.5 bg-white/90 backdrop-blur rounded-lg text-xs font-semibold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-1.5"
                                        >
                                            <FiExternalLink className="w-3.5 h-3.5" /> View Profile
                                        </button>
                                        {!isOwnProfile && (
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    // Navigate to chat with state to open conversation
                                                    // Assuming onStartChat handles navigation or we use window.location/navigate
                                                    if (onStartChat) {
                                                        onStartChat(profile);
                                                    } else {
                                                        // Fallback if onStartChat isn't provided (though it should be)
                                                        window.location.href = '/chat';
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-white/90 backdrop-blur rounded-lg text-xs font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-1.5"
                                            >
                                                <FiMessageSquare className="w-3.5 h-3.5" /> Message
                                            </button>
                                        )}
                                        {isOwnProfile && !isEditing && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="px-3 py-1.5 bg-white/90 backdrop-blur rounded-lg text-xs font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-1.5"
                                            >
                                                <FiEdit2 className="w-3.5 h-3.5" /> Edit
                                            </button>
                                        )}
                                        <button
                                            onClick={onClose}
                                            className="p-1.5 bg-white/90 backdrop-blur rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm ml-1"
                                        >
                                            <FiX className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* --- Profile Header Info --- */}
                                <div className="px-8 pb-6 -mt-12 relative z-10 border-b border-gray-100">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                                        {/* Avatar */}
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
                                                {formData.avatar_url ? (
                                                    <img src={formData.avatar_url} alt={formData.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                        <FiUser className="w-10 h-10" />
                                                    </div>
                                                )}
                                                {isEditing && (
                                                    <div
                                                        className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <FiCamera className="w-8 h-8 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />

                                            {/* Status Badge */}
                                            <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold border-2 border-white shadow-sm flex items-center gap-1 ${leaveStatus ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${leaveStatus ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                {leaveStatus ? 'On Leave' : 'Available'}
                                            </div>
                                        </div>

                                        {/* Name & Role */}
                                        <div className="flex-1 mb-1">
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <input
                                                        name="name"
                                                        value={formData.name || ''}
                                                        onChange={handleInputChange}
                                                        className="text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded px-2 py-1 w-full"
                                                        placeholder="Full Name"
                                                    />
                                                    <input
                                                        name="job_title"
                                                        value={formData.job_title || ''}
                                                        onChange={handleInputChange}
                                                        className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 w-full"
                                                        placeholder="Job Title"
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                                                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                                        <FiBriefcase className="w-4 h-4" />
                                                        <span>{profile.job_title || 'Team Member'}</span>
                                                        {team && (
                                                            <>
                                                                <span className="text-gray-300">•</span>
                                                                <span className="text-indigo-600 font-medium">{team.name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit Actions */}
                                        {isEditing && (
                                            <div className="flex gap-2 mb-1">
                                                <button
                                                    onClick={() => { setIsEditing(false); setFormData(profile); }}
                                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                                >
                                                    {saving ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* --- Content Tabs --- */}
                                <div className="flex border-b border-gray-100 px-8">
                                    {['about', 'projects', 'team'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {/* --- Tab Content --- */}
                                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'about' && (
                                            <motion.div key="about" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                                                {/* Bio */}
                                                <section>
                                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About</h3>
                                                    {isEditing ? (
                                                        <textarea
                                                            name="bio"
                                                            value={formData.bio || ''}
                                                            onChange={handleInputChange}
                                                            rows={3}
                                                            className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                            placeholder="Write a short bio..."
                                                        />
                                                    ) : (
                                                        <p className="text-sm text-gray-600 leading-relaxed">
                                                            {profile.bio || "No bio information provided."}
                                                        </p>
                                                    )}
                                                </section>

                                                {/* Contact Grid */}
                                                <section>
                                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <ContactItem icon={FiMail} label="Email" value={profile.email} />
                                                        <ContactItem icon={FiPhone} label="Phone" value={formData.phone} isEditing={isEditing} name="phone" onChange={handleInputChange} placeholder="+1 (555) 000-0000" />
                                                        <ContactItem icon={FiSlack} label="Slack" value={formData.slack_handle} isEditing={isEditing} name="slack_handle" onChange={handleInputChange} placeholder="@username" />
                                                        <ContactItem icon={FiLinkedin} label="LinkedIn" value={formData.linkedin_url} isEditing={isEditing} name="linkedin_url" onChange={handleInputChange} placeholder="Profile URL" isLink />
                                                        <ContactItem icon={FiCalendar} label="Joined" value={formData.start_date} isEditing={isEditing} name="start_date" onChange={handleInputChange} type="date" />
                                                    </div>
                                                </section>

                                                {/* Manager Info */}
                                                {manager && (
                                                    <section>
                                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Reporting To</h3>
                                                        <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                                            <img src={manager.avatar_url} alt={manager.name} className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                                                            <div>
                                                                <div className="text-sm font-semibold text-gray-900">{manager.name}</div>
                                                                <div className="text-xs text-gray-500">{manager.job_title || 'Manager'}</div>
                                                            </div>
                                                        </div>
                                                    </section>
                                                )}
                                            </motion.div>
                                        )}

                                        {activeTab === 'projects' && (
                                            <motion.div key="projects" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                                                <div className="space-y-3">
                                                    {projects.length > 0 ? (
                                                        projects.map((project) => (
                                                            <div key={project.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-gray-900">{project.name}</h4>
                                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{project.description || 'No description'}</p>
                                                                    </div>
                                                                    <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${project.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                                                                        }`}>
                                                                        {project.status.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                                                                        {project.role || 'Member'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-10 text-gray-400">
                                                            <FiFolder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                            <p className="text-sm">No active projects</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'team' && (
                                            <motion.div key="team" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                                                {team ? (
                                                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
                                                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                            <FiUsers className="w-8 h-8" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                                                        <p className="text-sm text-gray-500 mt-2">{team.description || 'No team description available.'}</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-10 text-gray-400">
                                                        <p className="text-sm">No team assigned</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : null}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- Helper Components ---
const ContactItem = ({ icon: Icon, label, value, isEditing, onChange, name, placeholder, type = "text", isLink }) => (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg">
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</div>
            {isEditing && name ? (
                <input
                    type={type}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-0.5"
                    placeholder={placeholder}
                />
            ) : (
                <div className="text-sm font-medium text-gray-900 truncate">
                    {isLink && value ? (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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

export default UserProfileInfoModal;
