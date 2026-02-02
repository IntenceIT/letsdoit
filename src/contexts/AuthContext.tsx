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

// Hardcoded users (NOT SECURE - for demo only)
const USERS = [
  { id: '1', email: 'yasirazimshaikh5440@gmail.com', password: 'yasirs2412', full_name: 'Yasir', role: 'admin' },
];

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
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setIsAdmin(parsed.email === 'yasirazimshaikh5440@gmail.com');
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Check hardcoded admin
    const adminUser = USERS.find(u => u.email === email && u.password === password);
    
    if (adminUser) {
      const userData = { id: adminUser.id, email: adminUser.email, full_name: adminUser.full_name };
      setUser(userData);
      setIsAdmin(true);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return { success: true };
    }

    // For any other email/password, treat as regular user (demo mode)
    if (email && password.length >= 6) {
      const userData = { id: Date.now().toString(), email, full_name: email.split('@')[0] };
      setUser(userData);
      setIsAdmin(false);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return { success: true };
    }

    return { success: false, error: 'Invalid credentials. Password must be at least 6 characters.' };
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
