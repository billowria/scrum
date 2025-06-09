import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProtectedRoute({ children, requiredRole }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (error) throw error;
          setUser({ ...session.user, role: data.role });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />; // Or an unauthorized page
  }

  return children;
} 