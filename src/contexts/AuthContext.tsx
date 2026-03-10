import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/integrations/firebase/config';
import { membersService, organizationsService } from '@/integrations/firebase/firestore';
import type { Member } from '@/integrations/firebase/types';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  member: Member | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (userName?: string) => Promise<{ success: boolean; error?: string; needsName?: boolean }>;
  signOut: () => Promise<void>;
  refreshMember: () => Promise<void>;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch member data - optimized
  const fetchMemberData = async (authUser: FirebaseUser) => {
    try {
      const memberData = await membersService.getByAuthUserId(authUser.uid);
      return memberData;
    } catch (error) {
      console.error('Error fetching member:', error);
      return null;
    }
  };

  const refreshMember = async () => {
    const authUser = auth.currentUser;
    if (authUser) {
      const memberData = await fetchMemberData(authUser);
      if (memberData) {
        setMember(memberData);
        setIsAdmin(memberData.role === 'admin');
        setUser({
          id: authUser.uid,
          email: authUser.email || '',
          full_name: memberData.full_name,
        });
      }
    }
  };

  // Optimized auth state initialization with better persistence
  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!isMounted) return;
      
      try {
        if (authUser) {
          // User is signed in, fetch member data
          const memberData = await fetchMemberData(authUser);
          
          if (memberData && isMounted) {
            setUser({
              id: authUser.uid,
              email: authUser.email || '',
              full_name: memberData.full_name,
            });
            setMember(memberData);
            setIsAdmin(memberData.role === 'admin');
          } else if (isMounted) {
            // Member data not found, sign out
            await firebaseSignOut(auth);
            setUser(null);
            setMember(null);
            setIsAdmin(false);
          }
        } else {
          // User is signed out
          setUser(null);
          setMember(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        if (isMounted) {
          setUser(null);
          setMember(null);
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    });

    // Reduced timeout to prevent long loading states
    const timeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      if (!userCredential.user) {
        return { 
          success: false, 
          error: 'Sign in failed' 
        };
      }

      const memberData = await fetchMemberData(userCredential.user);
      
      if (!memberData) {
        await firebaseSignOut(auth);
        return { 
          success: false, 
          error: 'User account not found. Please contact admin.' 
        };
      }

      setUser({
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        full_name: memberData.full_name,
      });
      setMember(memberData);
      setIsAdmin(memberData.role === 'admin');

      return { success: true };
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'An error occurred during sign in';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const signInWithGoogle = async (userName?: string): Promise<{ success: boolean; error?: string; needsName?: boolean }> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (!result.user) {
        return { 
          success: false, 
          error: 'Google sign in failed' 
        };
      }

      const firebaseUser = result.user;
      const email = firebaseUser.email || '';

      let memberData = await membersService.getByAuthUserId(firebaseUser.uid);

      if (!memberData) {
        if (!userName) {
          return {
            success: false,
            needsName: true,
            error: 'Please provide your name'
          };
        }

        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'yasirazimshaikh5440@gmail.com';
        const isAdminUser = email.toLowerCase() === adminEmail.toLowerCase();

        let organizationId: string;
        
        if (isAdminUser) {
          const orgs = await organizationsService.getAll();
          if (orgs.length === 0) {
            const newOrg = await organizationsService.create({
              organization_name: 'My Organization',
              created_by_admin_id: firebaseUser.uid,
            });
            organizationId = newOrg.id;
          } else {
            organizationId = orgs[0].id;
          }
        } else {
          const orgs = await organizationsService.getAll();
          if (orgs.length === 0) {
            await firebaseSignOut(auth);
            return {
              success: false,
              error: 'No organization found. Please contact admin to set up the system first.'
            };
          }
          organizationId = orgs[0].id;
        }

        memberData = await membersService.create({
          auth_user_id: firebaseUser.uid,
          organization_id: organizationId,
          full_name: userName.trim(),
          email: email,
          role: isAdminUser ? 'admin' : 'member',
          status: isAdminUser ? 'approved' : 'pending',
          mobile_number: firebaseUser.phoneNumber || null,
          fcm_token: null,
          last_login_at: null,
        });
      }

      setUser({
        id: firebaseUser.uid,
        email: email,
        full_name: memberData.full_name,
      });
      setMember(memberData);
      setIsAdmin(memberData.role === 'admin');

      return { success: true };
    } catch (error: any) {
      console.error('Google sign in error:', error);
      let errorMessage = 'An error occurred during Google sign in';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups for this site.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign in cancelled';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setMember(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign out error:', error);
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
        signInWithGoogle,
        signOut,
        refreshMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};