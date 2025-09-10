import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import UserProfilesWidget from './UserProfilesWidget';

// Add this component to the Dashboard where appropriate
const DashboardWidgets = ({ userTeamId, currentUser }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {/* Existing widgets can go here */}
      
      {/* User Profiles Widget */}
      <div className="lg:col-span-1">
        <UserProfilesWidget userTeamId={userTeamId} currentUser={currentUser} />
      </div>
      
      {/* Other widgets can go here */}
    </div>
  );
};

export default DashboardWidgets;