import React from 'react';
import { motion } from 'framer-motion';
import DailyStandupDemo from './DailyStandupDemo';
import TeamProgressDashboard from './TeamProgressDashboard';
import LeaveCalendarDemo from './LeaveCalendarDemo';
import AchievementTrackingDemo from './AchievementTrackingDemo';

const DemoSection = () => {
  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/3 left-0 w-full h-2/3 bg-gradient-to-b from-indigo-50/30 to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-indigo-100/30 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-4 text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            Powerful features with intuitive interfaces
          </motion.h2>
          
          <motion.p 
            className="text-xl text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Experience the tools that make team management effortless and engaging
          </motion.p>
        </div>
        
        {/* Demo containers */}
        <div className="space-y-32">
          {/* Daily Standup Report Interface */}
          <div>
            <DemoHeader 
              title="Daily Standup Reports" 
              description="Streamlined updates to keep your team in sync without lengthy meetings"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              }
              iconBg="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />
            <div className="mt-12">
              <DailyStandupDemo />
            </div>
          </div>
          
          {/* Team Progress Dashboard */}
          <div>
            <DemoHeader 
              title="Team Progress Dashboard" 
              description="Visualize team performance and track progress with real-time analytics"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              iconBg="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <div className="mt-12">
              <TeamProgressDashboard />
            </div>
          </div>
          
          {/* Leave Calendar Interface */}
          <div>
            <DemoHeader 
              title="Leave Calendar" 
              description="Coordinate time off and manage team availability with a visual calendar"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <div className="mt-12">
              <LeaveCalendarDemo />
            </div>
          </div>
          
          {/* Achievement Tracking Interface */}
          <div>
            <DemoHeader 
              title="Achievement Tracking" 
              description="Celebrate team wins and milestones to foster a culture of recognition"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
              iconBg="bg-gradient-to-br from-pink-500 to-pink-600"
            />
            <div className="mt-12">
              <AchievementTrackingDemo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Demo header component
const DemoHeader = ({ title, description, icon, iconBg }) => {
  return (
    <motion.div 
      className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7 }}
    >
      <div className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center text-white mb-4 md:mb-0 md:mr-5`}>
        {icon}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-lg text-gray-600 max-w-2xl">{description}</p>
      </div>
    </motion.div>
  );
};

export default DemoSection; 