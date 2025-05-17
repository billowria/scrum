import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiAward, FiStar, FiTarget, FiThumbsUp, 
  FiClipboard, FiUserCheck, FiCheck, FiGift, FiGithub,
  FiDownload, FiExternalLink, FiEye
} from 'react-icons/fi';
import { format } from 'date-fns';

// Award type icons and color themes mapping
const awardThemes = {
  promotion: {
    icon: <FiAward />,
    color: 'primary',
    gradient: 'from-primary-50 via-primary-100 to-white',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    border: 'border-primary-200',
    decoration: 'bg-primary-500',
    shadow: 'shadow-primary-100'
  },
  certificate: {
    icon: <FiClipboard />,
    color: 'green',
    gradient: 'from-green-50 via-green-100 to-white',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    border: 'border-green-200',
    decoration: 'bg-green-500',
    shadow: 'shadow-green-100'
  },
  recognition: {
    icon: <FiStar />,
    color: 'amber',
    gradient: 'from-amber-50 via-amber-100 to-white',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    border: 'border-amber-200',
    decoration: 'bg-amber-500',
    shadow: 'shadow-amber-100'
  },
  performance: {
    icon: <FiTarget />,
    color: 'red',
    gradient: 'from-red-50 via-red-100 to-white',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    border: 'border-red-200',
    decoration: 'bg-red-500',
    shadow: 'shadow-red-100'
  },
  milestone: {
    icon: <FiAward />,
    color: 'purple',
    gradient: 'from-purple-50 via-purple-100 to-white',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    border: 'border-purple-200',
    decoration: 'bg-purple-500',
    shadow: 'shadow-purple-100'
  },
  teamwork: {
    icon: <FiUserCheck />,
    color: 'blue',
    gradient: 'from-blue-50 via-blue-100 to-white',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-blue-200',
    decoration: 'bg-blue-500',
    shadow: 'shadow-blue-100'
  },
  achievement: {
    icon: <FiCheck />,
    color: 'primary',
    gradient: 'from-primary-50 via-primary-100 to-white',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    border: 'border-primary-200',
    decoration: 'bg-primary-500',
    shadow: 'shadow-primary-100'
  },
  special: {
    icon: <FiGift />,
    color: 'pink',
    gradient: 'from-pink-50 via-pink-100 to-white',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    border: 'border-pink-200',
    decoration: 'bg-pink-500',
    shadow: 'shadow-pink-100'
  },
  technical: {
    icon: <FiGithub />,
    color: 'gray',
    gradient: 'from-gray-50 via-gray-100 to-white',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-700',
    border: 'border-gray-200',
    decoration: 'bg-gray-700',
    shadow: 'shadow-gray-100'
  },
  other: {
    icon: <FiThumbsUp />,
    color: 'blue',
    gradient: 'from-blue-50 via-blue-100 to-white',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-blue-200',
    decoration: 'bg-blue-500',
    shadow: 'shadow-blue-100'
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
    boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -6px rgba(0, 0, 0, 0.05)",
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

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 } 
  },
  hover: { 
    scale: 1.1,
    backgroundColor: "#4F46E5",
    color: "#ffffff",
    transition: { duration: 0.2 }
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

  // Get theme data for this award type
  const theme = awardThemes[award_type] || awardThemes.other;

  // Get user data from the nested users object
  const userData = users || {};
  
  // Format the date
  const formattedDate = awarded_at ? format(new Date(awarded_at), 'MMM d, yyyy') : format(new Date(), 'MMM d, yyyy');

  // Get a preview of the description (first 50 characters)
  const descriptionPreview = description && description.length > 100 
    ? `${description.substring(0, 100)}...` 
    : description;
  
  return (
    <motion.div
      className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-xl ${theme.shadow} border ${theme.border} bg-gradient-to-br ${theme.gradient} cursor-pointer transition-all duration-300`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={() => onViewDetails(achievement)}
      layout
    >
      {/* Top decoration */}
      <div className={`h-2 w-full ${theme.decoration}`}></div>
      
      <div className="p-5">
        <div className="flex items-start space-x-3">
          {/* Award Icon */}
          <motion.div 
            className={`flex-shrink-0 p-3 rounded-full ${theme.iconBg} ${theme.iconColor} shadow-sm`}
            variants={iconVariants}
            whileHover="hover"
          >
            {theme.icon}
          </motion.div>
          
          <div className="flex-1">
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">{title}</h3>
            
            {/* Employee name and award type */}
            <div className="flex items-center justify-between mb-3">
              <div className={`text-sm font-medium text-${theme.color}-600`}>
                {userData?.name || 'Team Member'}
              </div>
              <div className="text-xs text-gray-500 capitalize px-2 py-1 bg-white/70 rounded-full shadow-sm">
                {award_type} • {formattedDate}
              </div>
            </div>
            
            {/* Description preview */}
            {description && (
              <div className="text-gray-600 text-sm mb-4 bg-white/70 p-3 rounded-md shadow-sm backdrop-blur-sm">
                {descriptionPreview}
              </div>
            )}
            
            {/* View more button */}
            <div className="flex justify-end mt-3">
              <motion.div 
                className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full ${theme.iconBg} ${theme.iconColor}`}
                variants={buttonVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <FiEye className="mr-1" />
                View Details
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* New badge */}
      {isNew && (
        <div className="absolute -top-1 -right-1">
          <motion.div 
            className={`${theme.decoration} text-white text-xs font-bold px-3 py-1 rounded-bl-md rounded-tr-md shadow-md`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            NEW
          </motion.div>
        </div>
      )}
      
      {/* User profile icon */}
      {image_url ? (
        <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-md">
          <img 
            src={image_url} 
            alt={userData?.name || 'Employee'} 
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className={`absolute -bottom-2 -right-2 h-12 w-12 rounded-full flex items-center justify-center border-2 border-white shadow-md ${theme.iconBg}`}>
          <span className={`${theme.iconColor} text-lg font-bold`}>
            {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default AchievementCard; 