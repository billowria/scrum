import React from 'react';
import { useParams } from 'react-router-dom';
import UserProfile from '../components/UserProfile';

const ProfilePage = () => {
  const { userId } = useParams();

  return (
    <div className="w-full py-6">
      <UserProfile userId={userId} />
    </div>
  );
};

export default ProfilePage;