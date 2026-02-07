import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded admin credentials
const ADMIN_EMAIL = 'yasirazimshaikh5440@gmail.com';
const ADMIN_PASSWORD = 'admin123456';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsAdmin(parsed.email === ADMIN_EMAIL);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check for admin login
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const userData = { 
          id: 'admin-1', 
          email: ADMIN_EMAIL, 
          full_name: 'Yasir Azim Shaikh' 
        };
        setUser(userData);
        setIsAdmin(true);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        return { success: true };
      }

      // For demo purposes, accept any other email/password combination as regular user
      if (email && password.length >= 6) {
        const userData = { 
          id: Date.now().toString(), 
          email, 
          full_name: email.split('@')[0] 
        };
        setUser(userData);
        setIsAdmin(false);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        return { success: true };
      }

      return { 
        success: false, 
        error: 'Invalid email or password. Password must be at least 6 characters.' 
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        success: false, 
        error: 'An error occurred during sign in' 
      };
    }
  };

  const signOut = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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