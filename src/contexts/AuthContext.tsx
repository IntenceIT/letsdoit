import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Member } from '@/integrations/supabase/types';

interface AuthContextType {
  user: User | null;
  member: Member | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch member data based on user
  const fetchMemberData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error) throw error;

      setMember(data);
      setIsAdmin(data.role === 'admin');
    } catch (error) {
      console.error('Error fetching member data:', error);
      setMember(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Check active session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await fetchMemberData(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          setUser(session.user);
          await fetchMemberData(session.user.id);
        } else {
          setUser(null);
          setMember(null);
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { 
          success: false, 
          error: error.message 
        };
      }

      if (data.user) {
        setUser(data.user);
        await fetchMemberData(data.user.id);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { 
        success: false, 
        error: error.message || 'An error occurred during sign in' 
      };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setMember(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        member,
        isAdmin,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};