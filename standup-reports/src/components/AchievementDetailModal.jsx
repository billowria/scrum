import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAward, FiStar, FiTarget, FiThumbsUp,
  FiClipboard, FiUserCheck, FiCheck, FiGift, FiGithub,
  FiX, FiDownload, FiShare2, FiCalendar, FiBriefcase, FiLinkedin,
  FiFileText, FiInfo, FiEdit, FiHexagon, FiZap, FiSun, FiCode
} from 'react-icons/fi';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTheme } from '../context/ThemeContext';

// Award type icons and color themes mapping - synced with AchievementCard
const awardThemes = {
  promotion: {
    icon: <FiAward />,
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-500/10',
    border: 'border-white/10',
    accentBorder: 'border-violet-500/30',
    text: 'text-violet-400',
    button: 'bg-violet-600 hover:bg-violet-700',
    glow: 'shadow-violet-500/20'
  },
  certificate: {
    icon: <FiClipboard />,
    gradient: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-500/10',
    border: 'border-white/10',
    accentBorder: 'border-emerald-500/30',
    text: 'text-emerald-400',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    glow: 'shadow-emerald-500/20'
  },
  recognition: {
    icon: <FiStar />,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
    border: 'border-white/10',
    accentBorder: 'border-amber-500/30',
    text: 'text-amber-400',
    button: 'bg-amber-600 hover:bg-amber-700',
    glow: 'shadow-amber-500/20'
  },
  performance: {
    icon: <FiTarget />,
    gradient: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-500/10',
    border: 'border-white/10',
    accentBorder: 'border-blue-500/30',
    text: 'text-blue-400',
    button: 'bg-blue-600 hover:bg-blue-700',
    glow: 'shadow-blue-500/20'
  },
  milestone: {
    icon: <FiAward />,
    gradient: 'from-rose-500 to-pink-500',
    bg: 'bg-rose-500/10',
    border: 'border-white/10',
    accentBorder: 'border-rose-500/30',
    text: 'text-rose-400',
    button: 'bg-rose-600 hover:bg-rose-700',
    glow: 'shadow-rose-500/20'
  },
  teamwork: {
    icon: <FiUserCheck />,
    gradient: 'from-cyan-500 to-teal-500',
    bg: 'bg-cyan-500/10',
    border: 'border-white/10',
    accentBorder: 'border-cyan-500/30',
    text: 'text-cyan-400',
    button: 'bg-cyan-600 hover:bg-cyan-700',
    glow: 'shadow-cyan-500/20'
  },
  achievement: {
    icon: <FiCheck />,
    gradient: 'from-indigo-500 to-purple-600',
    bg: 'bg-indigo-500/10',
    border: 'border-white/10',
    accentBorder: 'border-indigo-500/30',
    text: 'text-indigo-400',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    glow: 'shadow-indigo-500/20'
  },
  special: {
    icon: <FiSun />,
    gradient: 'from-fuchsia-500 to-pink-500',
    bg: 'bg-fuchsia-500/10',
    border: 'border-white/10',
    accentBorder: 'border-fuchsia-500/30',
    text: 'text-fuchsia-400',
    button: 'bg-fuchsia-600 hover:bg-fuchsia-700',
    glow: 'shadow-fuchsia-500/20'
  },
  technical: {
    icon: <FiCode />,
    gradient: 'from-slate-500 to-gray-600',
    bg: 'bg-slate-500/10',
    border: 'border-white/10',
    accentBorder: 'border-slate-500/30',
    text: 'text-slate-400',
    button: 'bg-slate-700 hover:bg-slate-800',
    glow: 'shadow-slate-500/20'
  },
  other: {
    icon: <FiThumbsUp />,
    gradient: 'from-gray-500 to-slate-600',
    bg: 'bg-gray-500/10',
    border: 'border-white/10',
    accentBorder: 'border-gray-500/30',
    text: 'text-gray-400',
    button: 'bg-gray-600 hover:bg-gray-700',
    glow: 'shadow-gray-500/20'
  }
};

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const modalVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.9,
    rotateX: -10
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    y: 30,
    scale: 0.95,
    rotateX: 10,
    transition: { duration: 0.2 }
  }
};

const TabButton = ({ active, onClick, icon, children, theme }) => (
  <motion.button
    className={`flex items-center justify-center py-4 px-6 text-sm font-bold relative transition-all duration-300 ${active ? `text-white bg-white/5` : 'text-white/40 hover:text-white/60 hover:bg-white/5'
      }`}
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {icon && <span className="mr-2">{icon}</span>}
    <span className="relative z-10">{children}</span>
    {active && (
      <motion.div
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient}`}
        layoutId="activeTabGlow"
      />
    )}
  </motion.button>
);

const AchievementDetailModal = ({ isOpen, achievement, onClose, defaultTab = 'details' }) => {
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loadingCertificate, setLoadingCertificate] = useState(true);
  const certificateRef = React.useRef(null);
  const { themeMode, isAnimatedTheme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setLoadingCertificate(true);
      const timer = setTimeout(() => setLoadingCertificate(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen, achievement, defaultTab]);

  if (!achievement) return null;

  const {
    title,
    description,
    award_type,
    awarded_at,
    users,
    creator,
    image_url
  } = achievement;

  const theme = awardThemes[award_type] || awardThemes.other;
  const userData = users || {};
  const creatorData = creator || {};
  const formattedDate = awarded_at
    ? format(new Date(awarded_at), 'MMMM d, yyyy')
    : format(new Date(), 'MMMM d, yyyy');

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    try {
      setDownloading(true);
      const element = certificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${award_type}-${userData.name}-${formattedDate}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleShareToLinkedIn = () => {
    const shareText = encodeURIComponent(`I'm proud to share my ${award_type} achievement: ${title}`);
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&title=${shareText}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-[30px] z-[100] flex items-center justify-center p-4 overflow-hidden"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
          onClick={onClose}
        >
          <motion.div
            className={`${isAnimatedTheme ? 'bg-transparent' : 'bg-slate-900'} ${!isAnimatedTheme ? 'backdrop-blur-xl' : ''} border border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl w-full max-w-4xl h-[90vh] max-h-[900px] flex flex-col relative transition-all duration-700`}
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glows */}
            <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br ${theme.gradient} opacity-20 blur-3xl pointer-events-none`} />
            <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr ${theme.gradient} opacity-10 blur-3xl pointer-events-none`} />

            {/* Hidden Certificate View for Export */}
            <div className="fixed left-[-9999px] top-[-9999px]">
              <div
                ref={certificateRef}
                className="bg-white p-20 w-[1024px] h-[768px] flex flex-col items-center justify-center border-[20px] border-double border-gray-100 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className={`w-32 h-32 rounded-3xl bg-gray-50 flex items-center justify-center mb-10 shadow-sm border border-gray-100`}>
                  <span className="text-gray-800 text-6xl">{theme.icon}</span>
                </div>
                <h1 className="text-5xl font-black text-gray-900 mb-2 uppercase tracking-tight">Certificate of Merit</h1>
                <h2 className="text-2xl text-gray-500 font-medium mb-12 capitalize tracking-widest">{award_type} Excellence</h2>
                <p className="text-xl text-gray-400 mb-4">This hereby certifies that</p>
                <h3 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 italic mb-12">{userData.name}</h3>
                <p className="text-xl text-gray-400 mb-6">has been formally recognized for outstanding achievement in</p>
                <h4 className="text-3xl font-bold text-gray-800 mb-16 text-center max-w-2xl px-10">{title}</h4>
                <div className="flex items-center justify-between w-full px-20 mt-auto pb-10">
                  <div className="text-left">
                    <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">Awarded Date</p>
                    <p className="font-bold text-lg text-gray-900">{formattedDate}</p>
                  </div>
                  <div className="text-center px-10">
                    <div className="w-20 h-0.5 bg-gray-200 mb-2 mx-auto" />
                    <p className="text-gray-400 text-xs italic">OFFICIAL SYNC SEAL</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">Authenticated by</p>
                    <p className="font-bold text-lg text-gray-900">{creatorData.name || 'Sync Management'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Header */}
            <div className="flex-shrink-0 relative z-10">
              <div className="p-8 pb-4 flex justify-between items-start">
                <div className="flex items-center gap-6">
                  <motion.div
                    className={`w-20 h-20 rounded-[1.5rem] bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-2xl ${theme.glow}`}
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                  >
                    <span className="text-4xl">{theme.icon}</span>
                  </motion.div>
                  <div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${theme.bg} ${theme.text} text-[10px] font-black uppercase tracking-widest mb-2 border ${theme.accentBorder}`}>
                      <FiAward className="w-3 h-3" />
                      {award_type}
                    </div>
                    <h2 className="text-3xl font-black text-white pr-10 leading-none tracking-tight">{title}</h2>
                  </div>
                </div>

                <motion.button
                  className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center border border-white/5 transition-all"
                  onClick={onClose}
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX size={24} />
                </motion.button>
              </div>

              {/* Enhanced Tab Navigation */}
              <div className="flex px-8 gap-1 mt-4 border-b border-white/5">
                <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={<FiInfo size={16} />} theme={theme}>DETAILS</TabButton>
                <TabButton active={activeTab === 'certificate'} onClick={() => setActiveTab('certificate')} icon={<FiAward size={16} />} theme={theme}>CERTIFICATE</TabButton>
                <TabButton active={activeTab === 'sharing'} onClick={() => setActiveTab('sharing')} icon={<FiShare2 size={16} />} theme={theme}>SHARE</TabButton>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="overflow-y-auto flex-grow custom-scrollbar relative z-10 px-8 py-8">
              <AnimatePresence mode="wait">
                {activeTab === 'details' && (
                  <motion.div
                    className="space-y-10"
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {/* Recipient Card */}
                    <div className="flex items-center gap-6 bg-white/5 p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
                      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${theme.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />

                      {userData.avatar_url || image_url ? (
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl flex-shrink-0 relative z-10">
                          <img src={userData.avatar_url || image_url} alt={userData.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-24 h-24 rounded-2xl ${theme.bg} flex items-center justify-center border-2 border-white/10 shadow-xl flex-shrink-0 relative z-10`}>
                          <span className={`text-4xl font-black ${theme.text}`}>{userData?.name?.[0] || 'U'}</span>
                        </div>
                      )}

                      <div className="relative z-10 flex-1 min-w-0">
                        <h3 className="text-2xl font-black text-white mb-1 truncate">{userData.name || 'Team Member'}</h3>
                        <div className="flex flex-wrap gap-4 text-white/40 text-sm">
                          <div className="flex items-center gap-1.5"><FiCalendar className={theme.text} /> <span>{formattedDate}</span></div>
                          <div className="flex items-center gap-1.5"><FiBriefcase className={theme.text} /> <span>Awarded by {creatorData.name || 'Sync'}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Section: Description */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${theme.bg} ${theme.text} flex items-center justify-center`}><FiFileText size={16} /></div>
                        <h4 className="text-lg font-bold text-white tracking-tight uppercase">Citation & Impact</h4>
                      </div>
                      <div className="p-8 rounded-3xl bg-slate-800/50 border border-white/5 text-white/80 leading-relaxed text-lg italic serif">
                        "{description || 'This achievement represents a significant contribution to the team and project success. Through dedication and excellence, the recipient has demonstrated core values of Sync.'}"
                      </div>
                    </div>

                    {/* Section: Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">Technical Classification</p>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${theme.bg} ${theme.text} flex items-center justify-center`}><FiCode size={20} /></div>
                          <span className="text-white font-bold capitalize">{award_type} Excellence</span>
                        </div>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">Award Authenticity</p>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${theme.bg} ${theme.text} flex items-center justify-center`}><FiCheck size={20} /></div>
                          <span className="text-white font-bold">Verified Achievement</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'certificate' && (
                  <motion.div
                    className="space-y-8"
                    key="certificate"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                  >
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
                      <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20 aspect-[1.414/1] flex flex-col items-center justify-center text-center p-12">
                        {loadingCertificate ? (
                          <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 border-4 ${theme.text.replace('text-', 'border-')} border-t-transparent rounded-full animate-spin mb-4`}></div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Forging your certificate...</p>
                          </div>
                        ) : (
                          <>
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                            <div className={`w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center mb-6 border border-gray-100`}>
                              <span className="text-gray-900 text-3xl">{theme.icon}</span>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-1 uppercase tracking-tighter">Certificate of {award_type}</h3>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-8">Official Sync Recognition</p>
                            <p className="text-sm text-gray-400 mb-2 italic">This is to certify that</p>
                            <p className="text-3xl font-black text-gray-900 mb-6 italic">{userData.name}</p>
                            <p className="text-sm text-gray-400 mb-4 px-10">has been formally recognized for the achievement of</p>
                            <p className="text-lg font-bold text-gray-800 line-clamp-2 max-w-md">{title}</p>
                            <div className="mt-auto pt-8 flex justify-between w-full border-t border-gray-100">
                              <div className="text-left">
                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Date</p>
                                <p className="text-xs font-bold text-gray-900">{formattedDate}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Signed</p>
                                <p className="text-xs font-bold text-gray-900">{creatorData.name || 'Sync'}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <motion.button
                      className={`w-full py-5 px-6 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl ${theme.glow}`}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownloadPDF}
                      disabled={downloading || loadingCertificate}
                    >
                      {downloading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiDownload className="w-6 h-6" />
                      )}
                      <span>{downloading ? 'Authenticating...' : 'Secure PDF Download'}</span>
                    </motion.button>
                  </motion.div>
                )}

                {activeTab === 'sharing' && (
                  <motion.div
                    className="space-y-8"
                    key="sharing"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <div className="bg-white/5 border border-white/5 p-10 rounded-[3rem] text-center space-y-8">
                      <div className={`w-24 h-24 rounded-full ${theme.bg} ${theme.text} flex items-center justify-center mx-auto shadow-inner`}>
                        <FiShare2 size={40} />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-3xl font-black text-white leading-none">Global Broadcast</h3>
                        <p className="text-white/40 text-lg">Amplify your wins to your professional network and build your reputation.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <motion.button
                          className="w-full py-5 bg-[#0077b5] text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
                          whileHover={{ scale: 1.02, backgroundColor: '#008ad1' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleShareToLinkedIn}
                        >
                          <FiLinkedin size={24} />
                          <span>Post on LinkedIn</span>
                        </motion.button>
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <p className="text-white/40 text-sm font-medium mb-4 italic">Post Preview:</p>
                        <div className="p-6 bg-slate-800/80 rounded-2xl border border-white/5 text-left text-white/80 leading-relaxed font-medium">
                          I'm excited to share that I've been recognized for excellence at Sync! 🚀 Awarded "{title}" for my contributions to the team. Proud to be part of such an amazing culture! #SyncAchievements #ProfessionalGrowth
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal Footer */}
            <div className="flex-shrink-0 p-6 bg-slate-950/40 border-t border-white/5 flex justify-between items-center px-10 relative z-10">
              <div className="flex items-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                VERIFIED SYNC BLOCKCHAIN RECORD
              </div>
              <motion.button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm tracking-tight border border-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                DISMISS
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementDetailModal;