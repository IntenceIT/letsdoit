import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
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
  signInWithGoogle: (userName?: string) => Promise<{ success: boolean; error?: string; needsName?: boolean; status?: string }>;
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
            // Member data not found - this is normal for new users during signup
            // Don't sign them out, just set user without member data
            // The routing system will handle redirecting them appropriately
            setUser({
              id: authUser.uid,
              email: authUser.email || '',
              full_name: authUser.displayName || '',
            });
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

  const signInWithGoogle = async (userName?: string): Promise<{ success: boolean; error?: string; needsName?: boolean; status?: string }> => {
    try {
      console.log('Step 1: Starting Google sign in...');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (!result.user) {
        console.error('Step 1 Failed: No user returned from Google');
        return { 
          success: false, 
          error: 'Google sign in failed' 
        };
      }

      console.log('Step 2: Google auth successful, user:', result.user.email);
      const firebaseUser = result.user;
      const email = firebaseUser.email || '';

      console.log('Step 3: Checking if member exists...');
      let memberData = await membersService.getByAuthUserId(firebaseUser.uid);

      // Helper function to check if email is admin
      const isAdminEmail = (userEmail: string): boolean => {
        const hardcodedAdmins = [
          'yasirazimshaikh5440@gmail.com',
          'mahimhussain444@gmail.com',
          'mohsinmir@gmail.com',
        ];
        const envAdmin = import.meta.env.VITE_ADMIN_EMAIL || '';
        const allAdmins = [...hardcodedAdmins, envAdmin].map(e => e.trim().toLowerCase()).filter(Boolean);
        return allAdmins.includes(userEmail.toLowerCase());
      };

      const isAdminUser = isAdminEmail(email);
      console.log('Admin check at login - Email:', email, '| Is Admin:', isAdminUser);

      // If member exists and is a regular member but email is in admin list, upgrade to admin
      if (memberData && memberData.role !== 'admin' && isAdminUser) {
        console.log('Step 3a: Upgrading existing member to admin...');
        try {
          await membersService.update(memberData.id, {
            role: 'admin',
            status: 'approved',
          });
          
          // Fetch updated member data
          memberData = await membersService.getById(memberData.id);
          console.log('Step 3a: Member upgraded to admin successfully');
        } catch (updateError: any) {
          console.error('Step 3a Failed: Error upgrading member to admin:', updateError);
        }
      }

      // If member exists but is rejected, allow them to re-apply by resetting to pending
      if (memberData && memberData.status === 'rejected') {
        console.log('Step 3b: Member was rejected, resetting to pending for re-application...');
        
        if (!userName) {
          return {
            success: false,
            needsName: true,
            error: 'Please provide your name'
          };
        }
        
        try {
          // Update the rejected member (or approved if admin) with new name
          await membersService.update(memberData.id, {
            status: isAdminUser ? 'approved' : 'pending',
            role: isAdminUser ? 'admin' : memberData.role || 'member',
            full_name: userName.trim(),
          });
          
          // Fetch updated member data
          memberData = await membersService.getById(memberData.id);
          console.log('Step 3b: Member reset successfully');
        } catch (updateError: any) {
          console.error('Step 3b Failed: Error updating rejected member:', updateError);
          return {
            success: false,
            error: `Failed to update member: ${updateError.message}`
          };
        }
      }

      if (!memberData) {
        console.log('Step 4: Member not found, creating new member...');
        
        if (!userName) {
          console.log('Step 4 Failed: No username provided');
          return {
            success: false,
            needsName: true,
            error: 'Please provide your name'
          };
        }

        console.log('Step 5: Admin check - Email:', email, '| Is Admin:', isAdminUser);

        let organizationId: string;
        
        if (isAdminUser) {
          console.log('Step 6a: Admin user - checking organizations...');
          const orgs = await organizationsService.getAll();
          if (orgs.length === 0) {
            console.log('Step 6a: No org found, creating new organization...');
            const newOrg = await organizationsService.create({
              organization_name: 'My Organization',
              created_by_admin_id: firebaseUser.uid,
            });
            organizationId = newOrg.id;
            console.log('Step 6a: Organization created:', organizationId);
          } else {
            organizationId = orgs[0].id;
            console.log('Step 6a: Using existing organization:', organizationId);
          }
        } else {
          console.log('Step 6b: Regular user - checking organizations...');
          const orgs = await organizationsService.getAll();
          if (orgs.length === 0) {
            console.error('Step 6b Failed: No organization found');
            await firebaseSignOut(auth);
            return {
              success: false,
              error: 'No organization found. Please contact admin to set up the system first.'
            };
          }
          organizationId = orgs[0].id;
          console.log('Step 6b: Using organization:', organizationId);
        }

        console.log('Step 7: Creating member document...');
        try {
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
          console.log('Step 7: Member created successfully:', memberData);
        } catch (createError: any) {
          console.error('Step 7 Failed: Error creating member:', createError);
          await firebaseSignOut(auth);
          return {
            success: false,
            error: `Failed to create member: ${createError.message}`
          };
        }
      } else {
        console.log('Step 4: Member found:', memberData);
      }

      console.log('Step 8: Setting auth state...');
      setUser({
        id: firebaseUser.uid,
        email: email,
        full_name: memberData.full_name,
      });
      setMember(memberData);
      setIsAdmin(memberData.role === 'admin');

      console.log('Step 9: Sign in complete! Status:', memberData.status);
      return { 
        success: true,
        status: memberData.status
      };
    } catch (error: any) {
      console.error('Google sign in error (outer catch):', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'An error occurred during Google sign in';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups for this site.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign in cancelled';
      } else if (error.message) {
        errorMessage = error.message;
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
        signInWithGoogle,
        signOut,
        refreshMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};