import React from 'react';
import { motion } from 'framer-motion';
import {
  FiAward, FiStar, FiTarget, FiThumbsUp,
  FiClipboard, FiUserCheck, FiCheck, FiGift, FiGithub,
  FiDownload, FiExternalLink, FiEye, FiCalendar, FiUser, FiCode, FiZap, FiSun
} from 'react-icons/fi';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';

// Award type icons and color themes mapping
const awardThemes = {
  promotion: {
    icon: <FiAward />,
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    text: 'text-violet-400',
    glow: 'shadow-violet-500/20'
  },
  certificate: {
    icon: <FiClipboard />,
    gradient: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20'
  },
  recognition: {
    icon: <FiStar />,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20'
  },
  performance: {
    icon: <FiTarget />,
    gradient: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20'
  },
  milestone: {
    icon: <FiAward />,
    gradient: 'from-rose-500 to-pink-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    glow: 'shadow-rose-500/20'
  },
  teamwork: {
    icon: <FiUserCheck />,
    gradient: 'from-cyan-500 to-teal-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20'
  },
  achievement: {
    icon: <FiCheck />,
    gradient: 'from-indigo-500 to-purple-600',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    text: 'text-indigo-400',
    glow: 'shadow-indigo-500/20'
  },
  special: {
    icon: <FiSun />,
    gradient: 'from-fuchsia-500 to-pink-500',
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/20',
    text: 'text-fuchsia-400',
    glow: 'shadow-fuchsia-500/20'
  },
  technical: {
    icon: <FiCode />,
    gradient: 'from-slate-500 to-gray-600',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    text: 'text-slate-400',
    glow: 'shadow-slate-500/20'
  },
  other: {
    icon: <FiThumbsUp />,
    gradient: 'from-gray-500 to-slate-600',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    text: 'text-gray-400',
    glow: 'shadow-gray-500/20'
  }
};

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { type: 'spring', stiffness: 500, damping: 30 }
  }
};

const iconVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }
  },
  hover: {
    scale: 1.15,
    rotate: [0, -10, 10, -5, 5, 0],
    transition: { duration: 0.5 }
  }
};

const AchievementCard = ({ achievement, isNew = false, onViewDetails }) => {
  const {
    title,
    description,
    award_type,
    awarded_at,
    users, // The user who received the achievement
    image_url
  } = achievement;

  const { themeMode, isAnimatedTheme } = useTheme();

  // Get theme data for this award type
  const awardTheme = awardThemes[award_type] || awardThemes.other;

  // Get user data from the nested users object
  const userData = users || {};

  // Format the date
  const formattedDate = awarded_at ? format(new Date(awarded_at), 'MMM d, yyyy') : format(new Date(), 'MMM d, yyyy');

  // Get a preview of the description (first 100 characters)
  const descriptionPreview = description && description.length > 100
    ? `${description.substring(0, 100)}...`
    : description;

  return (
    <motion.div
      className={`relative group h-full cursor-pointer transition-all duration-300`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={() => onViewDetails(achievement)}
      layout
    >
      <div className={`relative h-full ${isAnimatedTheme ? 'bg-transparent' : 'bg-slate-800/40'} ${!isAnimatedTheme ? 'backdrop-blur-2xl' : ''} rounded-[2rem] border border-white/5 overflow-hidden transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:shadow-${awardTheme.text.split('-')[1]}-500/10 flex flex-col`}>
        {/* Top colored bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${awardTheme.gradient}`} />

        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-start space-x-4 mb-5">
            {/* Award Icon */}
            <motion.div
              className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${awardTheme.gradient} flex items-center justify-center text-white shadow-lg ${awardTheme.glow}`}
              variants={iconVariants}
              whileHover="hover"
            >
              <span className="text-2xl">{awardTheme.icon}</span>
            </motion.div>

            <div className="flex-1 min-w-0">
              {/* Type and Date */}
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${awardTheme.text} italic`}>
                  {award_type}
                </span>
                <span className="text-[10px] text-white/30 font-black uppercase tracking-tighter">
                  {formattedDate}
                </span>
              </div>
              {/* Title */}
              <h3 className="text-xl font-black text-white leading-none tracking-tight line-clamp-2 group-hover:text-white transition-colors">{title}</h3>
            </div>
          </div>

          {/* Recipient User Info - Glassier */}
          <div className="flex items-center gap-3 mb-6 bg-white/5 p-3 rounded-2xl border border-white/5 transition-colors group-hover:bg-white/10">
            {userData.avatar_url || image_url ? (
              <div className="relative">
                <img
                  src={userData.avatar_url || image_url}
                  alt={userData?.name}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
            ) : (
              <div className={`w-10 h-10 rounded-xl ${awardTheme.bg} flex items-center justify-center border border-white/10`}>
                <span className={`${awardTheme.text} text-sm font-black`}>
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate leading-none mb-1">{userData?.name || 'Sync Member'}</p>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest truncate">Verified Recipient</p>
            </div>
          </div>

          {/* Description preview */}
          {description && (
            <div className="text-white/60 text-sm leading-relaxed line-clamp-3 mb-6 flex-1 font-medium">
              {descriptionPreview}
            </div>
          )}

          {/* Footer actions - cleaner */}
          <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/5">
            <div className="flex items-center text-white/30 text-[10px] font-black uppercase tracking-widest">
              <FiEye className="mr-2 w-3.5 h-3.5" />
              CITATON DETAILS
            </div>
            <motion.div
              className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:bg-gradient-to-br ${awardTheme.gradient} group-hover:text-white group-hover:shadow-lg transition-all duration-300`}
              whileHover={{ scale: 1.1 }}
            >
              <FiExternalLink className="w-4 h-4" />
            </motion.div>
          </div>
        </div>

        {/* New badge - refined */}
        {isNew && (
          <div className="absolute top-5 right-5 z-10">
            <motion.div
              className={`bg-rose-500/90 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg border border-white/20`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.1, 1], opacity: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              NEW
            </motion.div>
          </div>
        )}

        {/* Shimmer effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        />

        {/* Scanning line */}
        <motion.div
          className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-none"
          initial={{ left: '-10%' }}
          whileHover={{ left: '110%' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  );
};

export default AchievementCard;