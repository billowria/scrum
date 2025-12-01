import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAward, FiStar, FiTarget, FiThumbsUp,
  FiClipboard, FiUserCheck, FiCheck, FiGift, FiGithub,
  FiX, FiDownload, FiShare2, FiCalendar, FiBriefcase, FiLinkedin,
  FiFileText, FiInfo, FiEdit
} from 'react-icons/fi';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Award type icons and color themes mapping - keeping consistent with AchievementCard
const awardThemes = {
  promotion: {
    icon: <FiAward />,
    color: 'primary',
    gradient: 'from-primary-50 via-primary-100 to-white',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    border: 'border-primary-200',
    decoration: 'bg-primary-500',
    badgeBg: 'bg-primary-100',
    badgeText: 'text-primary-800',
    buttonBg: 'bg-primary-600',
    buttonHover: 'hover:bg-primary-700',
    lightBg: 'bg-primary-50'
  },
  certificate: {
    icon: <FiClipboard />,
    color: 'green',
    gradient: 'from-green-50 via-green-100 to-white',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    border: 'border-green-200',
    decoration: 'bg-green-500',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-800',
    buttonBg: 'bg-green-600',
    buttonHover: 'hover:bg-green-700',
    lightBg: 'bg-green-50'
  },
  recognition: {
    icon: <FiStar />,
    color: 'amber',
    gradient: 'from-amber-50 via-amber-100 to-white',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    border: 'border-amber-200',
    decoration: 'bg-amber-500',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    buttonBg: 'bg-amber-600',
    buttonHover: 'hover:bg-amber-700',
    lightBg: 'bg-amber-50'
  },
  performance: {
    icon: <FiTarget />,
    color: 'red',
    gradient: 'from-red-50 via-red-100 to-white',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    border: 'border-red-200',
    decoration: 'bg-red-500',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
    buttonBg: 'bg-red-600',
    buttonHover: 'hover:bg-red-700',
    lightBg: 'bg-red-50'
  },
  milestone: {
    icon: <FiAward />,
    color: 'purple',
    gradient: 'from-purple-50 via-purple-100 to-white',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    border: 'border-purple-200',
    decoration: 'bg-purple-500',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    buttonBg: 'bg-purple-600',
    buttonHover: 'hover:bg-purple-700',
    lightBg: 'bg-purple-50'
  },
  teamwork: {
    icon: <FiUserCheck />,
    color: 'blue',
    gradient: 'from-blue-50 via-blue-100 to-white',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-blue-200',
    decoration: 'bg-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    buttonBg: 'bg-blue-600',
    buttonHover: 'hover:bg-blue-700',
    lightBg: 'bg-blue-50'
  },
  achievement: {
    icon: <FiCheck />,
    color: 'primary',
    gradient: 'from-primary-50 via-primary-100 to-white',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    border: 'border-primary-200',
    decoration: 'bg-primary-500',
    badgeBg: 'bg-primary-100',
    badgeText: 'text-primary-800',
    buttonBg: 'bg-primary-600',
    buttonHover: 'hover:bg-primary-700',
    lightBg: 'bg-primary-50'
  },
  special: {
    icon: <FiGift />,
    color: 'pink',
    gradient: 'from-pink-50 via-pink-100 to-white',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    border: 'border-pink-200',
    decoration: 'bg-pink-500',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-800',
    buttonBg: 'bg-pink-600',
    buttonHover: 'hover:bg-pink-700',
    lightBg: 'bg-pink-50'
  },
  technical: {
    icon: <FiGithub />,
    color: 'gray',
    gradient: 'from-gray-50 via-gray-100 to-white',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-700',
    border: 'border-gray-200',
    decoration: 'bg-gray-700',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-800',
    buttonBg: 'bg-gray-700',
    buttonHover: 'hover:bg-gray-800',
    lightBg: 'bg-gray-50'
  },
  other: {
    icon: <FiThumbsUp />,
    color: 'blue',
    gradient: 'from-blue-50 via-blue-100 to-white',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-blue-200',
    decoration: 'bg-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    buttonBg: 'bg-blue-600',
    buttonHover: 'hover:bg-blue-700',
    lightBg: 'bg-blue-50'
  }
};

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const modalVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
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
    transition: { duration: 0.2 }
  }
};

const buttonVariants = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.95 }
};

const tabVariants = {
  inactive: { opacity: 0.7, y: 5 },
  active: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 500, damping: 30 }
  }
};

const TabButton = ({ active, onClick, icon, children, color }) => (
  <motion.button
    className={`flex items-center justify-center py-3 px-4 text-sm font-medium relative rounded-t-lg ${active ? `bg-white text-${color}-700` : 'text-gray-600 hover:bg-white/20'
      }`}
    variants={tabVariants}
    animate={active ? 'active' : 'inactive'}
    onClick={onClick}
    whileHover={{ opacity: active ? 1 : 0.9 }}
    whileTap={{ scale: 0.97 }}
  >
    {icon && <span className="mr-2">{icon}</span>}
    {children}
    {active && (
      <motion.div
        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${color}-600`}
        layoutId="activeTab"
      />
    )}
  </motion.button>
);

const AchievementDetailModal = ({ isOpen, achievement, onClose, defaultTab = 'details' }) => {
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loadingCertificate, setLoadingCertificate] = useState(true);
  const certificateRef = React.useRef(null);

  useEffect(() => {
    // Reset to default tab when opening a new achievement
    if (isOpen) {
      setActiveTab(defaultTab);
      setLoadingCertificate(true);
      const timer = setTimeout(() => setLoadingCertificate(false), 500);
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

  // Get theme data for this award type
  const theme = awardThemes[award_type] || awardThemes.other;

  // Color name for dynamic classes (e.g., 'primary', 'blue', etc.)
  const colorName = theme.color || 'primary';

  // Get user data from the nested users object
  const userData = users || {};
  const creatorData = creator || {};

  // Format the date
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
        useCORS: true
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
    // This would typically use the LinkedIn Share API
    // For this demo, we'll just create a sample share URL
    const shareText = encodeURIComponent(`I'm proud to share my ${award_type} achievement: ${title}`);
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&title=${shareText}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-xl overflow-hidden shadow-xl w-full max-w-3xl h-[85vh] max-h-[850px] flex flex-col"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Certificate view - for PDF export - hidden from view */}
            <div className="hidden">
              <div
                id="achievement-certificate"
                ref={certificateRef}
                className="bg-white p-10 w-[1024px] h-[768px] flex flex-col items-center justify-center border-8 border-double border-gray-200"
              >
                <div className={`w-20 h-20 ${theme.iconBg} rounded-full flex items-center justify-center mb-6`}>
                  <span className={`${theme.iconColor} text-4xl`}>{theme.icon}</span>
                </div>

                <h1 className="text-4xl font-bold text-gray-800 mb-6">Certificate of {award_type}</h1>

                <p className="text-xl mb-8">This certifies that</p>
                <h2 className="text-3xl font-bold text-gray-900 italic mb-8">{userData.name}</h2>
                <p className="text-xl mb-10">has been recognized for</p>
                <h3 className="text-2xl font-bold text-gray-800 mb-12 text-center max-w-2xl">{title}</h3>

                <p className="italic text-gray-600 mb-8 text-center max-w-2xl">{description}</p>

                <div className="flex items-center justify-between w-full mt-auto">
                  <div className="text-left">
                    <p className="text-gray-600">Awarded on</p>
                    <p className="font-bold">{formattedDate}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-gray-600">Awarded by</p>
                    <p className="font-bold">{creatorData.name || 'Sync'}</p>
                  </div>
                </div>

                <div className="absolute bottom-5 left-5 text-sm text-gray-400">
                  Generated by Sync
                </div>
              </div>
            </div>

            {/* Modal header */}
            <div className={`flex-shrink-0 border-b ${theme.border} bg-gradient-to-r ${theme.gradient}`}>
              <div className="p-5 flex justify-between items-start">
                <div className="flex items-center">
                  <div className={`${theme.iconBg} p-3 rounded-full ${theme.iconColor} mr-4 flex-shrink-0 shadow-sm`}>
                    {theme.icon}
                  </div>
                  <div>
                    <div className={`${theme.badgeBg} ${theme.badgeText} text-xs font-medium px-2 py-1 rounded-full inline-block mb-1 capitalize`}>
                      {award_type}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 pr-6">{title}</h2>
                  </div>
                </div>

                <motion.button
                  className="p-2 rounded-full hover:bg-white/50 text-gray-600"
                  onClick={onClose}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  aria-label="Close modal"
                >
                  <FiX size={20} />
                </motion.button>
              </div>

              {/* Tabs */}
              <div className="flex border-t border-gray-200/50">
                <TabButton
                  active={activeTab === 'details'}
                  onClick={() => setActiveTab('details')}
                  icon={<FiInfo />}
                  color={colorName}
                >
                  Details
                </TabButton>
                <TabButton
                  active={activeTab === 'certificate'}
                  onClick={() => setActiveTab('certificate')}
                  icon={<FiAward />}
                  color={colorName}
                >
                  Certificate
                </TabButton>
                <TabButton
                  active={activeTab === 'sharing'}
                  onClick={() => setActiveTab('sharing')}
                  icon={<FiShare2 />}
                  color={colorName}
                >
                  Share
                </TabButton>
              </div>
            </div>

            {/* Modal content - scrollable area */}
            <div className="overflow-y-auto flex-grow">
              <AnimatePresence mode="wait">
                {activeTab === 'details' && (
                  <motion.div
                    className="p-5 space-y-6"
                    key="details"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Recipient info */}
                    <div className="flex items-start">
                      {image_url ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-white shadow-md flex-shrink-0">
                          <img
                            src={image_url}
                            alt={userData?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-16 h-16 rounded-full mr-4 ${theme.iconBg} flex items-center justify-center border-2 border-white shadow-md flex-shrink-0`}>
                          <span className={`text-xl font-bold ${theme.iconColor}`}>
                            {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                      )}

                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {userData?.name || 'Team Member'}
                        </h3>

                        <div className="flex items-center text-gray-600 mt-1">
                          <FiCalendar className="mr-2 text-sm flex-shrink-0" />
                          <span className="text-sm">Awarded on {formattedDate}</span>
                        </div>

                        {creatorData?.name && (
                          <div className="flex items-center text-gray-600 mt-1">
                            <FiBriefcase className="mr-2 text-sm flex-shrink-0" />
                            <span className="text-sm">By {creatorData.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Achievement description */}
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <div className={`w-1 h-5 ${theme.decoration} rounded mr-2`}></div>
                        Achievement Description
                      </h4>
                      <div className={`p-5 rounded-lg border ${theme.border} ${theme.lightBg}`}>
                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                          {description || 'No detailed description provided.'}
                        </p>
                      </div>
                    </div>

                    {/* Award information */}
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <div className={`w-1 h-5 ${theme.decoration} rounded mr-2`}></div>
                        Award Information
                      </h4>
                      <div className={`p-5 rounded-lg border ${theme.border} ${theme.lightBg}`}>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Award Type</div>
                            <div className="font-medium text-gray-800 capitalize flex items-center">
                              <span className={`${theme.iconColor} mr-2`}>{theme.icon}</span>
                              {award_type}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Award Date</div>
                            <div className="font-medium text-gray-800 flex items-center">
                              <FiCalendar className={`${theme.iconColor} mr-2`} />
                              {formattedDate}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'certificate' && (
                  <motion.div
                    className="p-5 space-y-6"
                    key="certificate"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Certificate preview */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <h4 className="font-medium text-gray-700 p-4 border-b">Certificate Preview</h4>

                      {loadingCertificate ? (
                        <div className="aspect-[4/3] flex justify-center items-center bg-gray-50 p-8">
                          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-white border-4 border-double border-gray-200 p-8 flex flex-col items-center justify-center text-center overflow-hidden">
                          <div className={`w-16 h-16 ${theme.iconBg} rounded-full flex items-center justify-center mb-4 shadow-md`}>
                            <span className={`${theme.iconColor} text-2xl`}>{theme.icon}</span>
                          </div>

                          <h3 className="text-2xl font-bold text-gray-800 mb-3 capitalize">Certificate of {award_type}</h3>
                          <p className="text-sm mb-2">This certifies that</p>
                          <p className="text-xl font-bold text-gray-900 mb-2">{userData.name}</p>
                          <p className="text-sm mb-3">has been recognized for</p>
                          <p className="text-lg font-bold text-gray-800 mb-4 max-w-md">{title}</p>

                          {description && (
                            <p className="text-xs text-gray-600 italic mb-4 max-w-md line-clamp-3">{description}</p>
                          )}

                          <div className="mt-auto flex justify-between w-full px-4">
                            <div className="text-left">
                              <p className="text-xs text-gray-600">Awarded on</p>
                              <p className="text-sm font-semibold">{formattedDate}</p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-gray-600">Awarded by</p>
                              <p className="text-sm font-semibold">{creatorData.name || 'Sync'}</p>
                            </div>
                          </div>

                          <div className="absolute bottom-16 left-12 text-xs text-gray-400">
                            Generated by Sync
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Download button */}
                    <motion.button
                      className={`flex items-center justify-center w-full py-3 px-4 rounded-lg ${theme.buttonBg} ${theme.buttonHover} text-white text-sm font-medium shadow-sm`}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={handleDownloadPDF}
                      disabled={downloading || loadingCertificate}
                    >
                      <FiDownload className="mr-2" />
                      {downloading ? 'Preparing PDF...' : 'Download Certificate (PDF)'}
                    </motion.button>
                  </motion.div>
                )}

                {activeTab === 'sharing' && (
                  <motion.div
                    className="p-5 space-y-6"
                    key="sharing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-700 mb-4">Share Your Achievement</h4>

                      <div className="space-y-4">
                        <motion.button
                          className="flex items-center justify-center w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm"
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          onClick={handleShareToLinkedIn}
                        >
                          <FiLinkedin className="mr-2" />
                          Share to LinkedIn
                        </motion.button>

                        <div className="text-sm text-gray-600 p-4 bg-white rounded-lg border border-gray-200">
                          <p className="mb-2 font-medium text-gray-700">Why share your achievements?</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Build your professional brand</li>
                            <li>Showcase your skills and accomplishments</li>
                            <li>Increase visibility to potential employers</li>
                            <li>Celebrate your success with your network</li>
                          </ul>
                        </div>

                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Share text preview:</h5>
                          <div className="p-3 bg-white rounded border border-gray-200 text-sm text-gray-600">
                            I'm proud to share my {award_type} achievement: {title}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal footer */}
            <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50 text-center text-sm text-gray-500 flex justify-between items-center">
              <span>This achievement is permanently recorded in your profile</span>
              <div className="flex space-x-2">
                <motion.button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementDetailModal; 