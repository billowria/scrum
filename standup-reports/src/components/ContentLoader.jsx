import React from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiMessageSquare, FiCalendar, FiClock, FiSearch, FiGrid, FiList } from 'react-icons/fi';

const ContentLoader = ({ type = "projects" }) => {
  const getConfig = () => {
    switch (type) {
      case "notifications":
        return {
          title: "Notification Center",
          subtitle: "Stay connected with your team's activities",
          items: 8,
          itemHeight: "h-24",
          variant: "notifications"
        };
      case "projects":
      default:
        return {
          title: "My Projects",
          subtitle: "View and explore your assigned project workspace",
          items: 6,
          itemHeight: "h-32",
          variant: "projects"
        };
    }
  };

  const config = getConfig();

  // Specific loader for notifications - matches the actual NotificationsPage header
  const NotificationHeaderLoader = () => (
    <div className="relative mb-4">
      {/* Stunning Gradient Header - exact match */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 shadow-2xl">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.4),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.2),transparent_50%)]" />
        </div>

        {/* Floating Animation Elements */}
        <div className="absolute top-6 right-12 w-3 h-3 bg-blue-400/70 rounded-full animate-pulse" />
        <div className="absolute bottom-8 left-12 w-2 h-2 bg-indigo-400/60 rounded-full animate-pulse" />
        <div className="absolute top-1/2 left-1/4 w-2.5 h-2.5 bg-purple-400/50 rounded-full animate-pulse" />

        <div className="relative p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Section */}
            <div className="flex items-center gap-6">
              <div className="relative p-5 bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 shadow-xl">
                <div className="w-10 h-10 bg-white/20 rounded-xl animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-3xl blur-xl" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/20 rounded-full animate-pulse" />
              </div>

              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  {config.title}
                </h1>
                <p className="text-blue-100/90 text-lg lg:text-xl">
                  {config.subtitle}
                </p>
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="flex items-center gap-6 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/20 shadow-xl">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-8 bg-white/30 rounded-full mx-auto mb-1 animate-pulse" />
                  <div className="h-3 bg-white/20 rounded-full w-16 mx-auto animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="mt-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Search & Filter Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            {/* Search Bar */}
            <div className="relative w-full sm:w-80">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-300 rounded-full animate-pulse" />
              <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse" />
            </div>

            {/* Type Filter Pills */}
            <div className="flex items-center gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-xl animate-pulse">
                  <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
                  <div className="h-4 bg-gray-300 rounded-full w-20 animate-pulse" />
                  <div className="w-6 h-4 bg-gray-200 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Section */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <div className="p-2 rounded-lg bg-white shadow-sm w-9 h-9 animate-pulse" />
              <div className="p-2 rounded-lg w-9 h-9 animate-pulse" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <div className="p-3 bg-gray-100 rounded-xl w-12 h-12 animate-pulse" />
              <div className="p-3 bg-gray-100 rounded-xl w-12 h-12 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Specific loader for projects - matches the actual ProjectsPage header
  const ProjectHeaderLoader = () => (
    <div className="relative mb-6">
      {/* Stunning Gradient Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 shadow-2xl">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(99,102,241,0.4),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(168,85,247,0.3),transparent_50%)]" />
        </div>

        {/* Floating Elements */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}

        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="relative p-6 bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 shadow-2xl">
                <div className="w-12 h-12 bg-white/20 rounded-xl animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-purple-500/40 rounded-3xl blur-xl" />
              </div>

              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {config.title}
                </h1>
                <p className="text-blue-100/90 text-lg lg:text-xl font-medium">
                  {config.subtitle}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl mx-auto mb-2 animate-pulse" />
                  <div className="h-4 bg-white/30 rounded-full animate-pulse mb-1" />
                  <div className="h-3 bg-white/20 rounded-full animate-pulse w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="mt-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <div className="relative w-full sm:w-96">
              <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse" />
            </div>
            
            <div className="flex items-center gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-4 py-2.5 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 bg-gray-100 rounded-xl animate-pulse" />
            <div className="px-4 py-2.5 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );

  // Specific loader for notifications
  const NotificationLoader = () => (
    <div className="space-y-4">
      {[...Array(config.items)].map((_, index) => (
        <motion.div
          key={index}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-start gap-4">
            {/* Icon placeholder */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 bg-blue-200 rounded-full" />
            </div>
            
            {/* Content placeholder */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded-full w-3/4 mb-2" />
                  <div className="h-4 bg-gray-100 rounded-full w-full mb-3" />
                  <div className="h-3 bg-gray-100 rounded-full w-2/3" />
                </div>
                <div className="w-6 h-6 bg-gray-200 rounded-full ml-4" />
              </div>
              
              <div className="flex items-center gap-4 mt-3">
                <div className="h-3 bg-gray-100 rounded-full w-24" />
                <div className="h-3 bg-gray-100 rounded-full w-20" />
                <div className="h-3 bg-gray-100 rounded-full w-16" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // Specific loader for projects
  const ProjectLoader = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(config.items)].map((_, index) => (
        <motion.div
          key={index}
          className={`${config.itemHeight} bg-gray-50 rounded-xl border border-gray-200 overflow-hidden animate-pulse`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="p-6 h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                <div>
                  <div className="h-4 bg-gray-200 rounded-full animate-pulse w-24 mb-2" />
                  <div className="h-3 bg-gray-100 rounded-full animate-pulse w-16" />
                </div>
              </div>
              <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse" />
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-full animate-pulse w-5/6" />
              <div className="h-3 bg-gray-100 rounded-full animate-pulse w-3/4" />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/3" />
              <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Section - Always visible */}
      {config.variant === "notifications" ? <NotificationHeaderLoader /> : <ProjectHeaderLoader />}

      {/* Content Area with Animated Skeleton */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          {config.variant === "notifications" ? <NotificationLoader /> : <ProjectLoader />}
        </div>
      </div>
    </div>
  );
};

export default ContentLoader;