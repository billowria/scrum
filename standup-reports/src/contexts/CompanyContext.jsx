import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CompanyContext = createContext();

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's companies and set the current one
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's company and role directly
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id, role')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user company:', userError);
        setError(userError.message);
        return;
      }

      if (userData && userData.company_id) {
        // Fetch the specific company info
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userData.company_id)
          .single();

        if (companyError) {
          console.error('Error fetching company:', companyError);
          setError(companyError.message);
          return;
        }

        setCurrentCompany(companyData);
        setUserRole(userData.role);
        setCompanies([companyData]); // For now, just this company
      } else {
        // User has no company assigned
        setCurrentCompany(null);
        setUserRole(null);
        setCompanies([]);
      }
    } catch (err) {
      console.error('Error in fetchCompanies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();

    // Set up real-time listener for user changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setCurrentCompany(null);
        setUserRole(null);
        setCompanies([]);
      } else if (event === 'SIGNED_IN') {
        // Refresh company data when user signs in
        fetchCompanies();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentCompany,
    userRole,
    companies,
    loading,
    error,
    setCurrentCompany,
    setCompanies,
    refreshCompanies: fetchCompanies
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};