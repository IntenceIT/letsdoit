import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
import { toast } from '@/hooks/use-toast';

const PendingApproval: React.FC = () => {
  const { user, member, signOut, refreshMember } = useAuth();
  const navigate = useNavigate();

  // Real-time listener for member status changes
  useEffect(() => {
    if (!user?.id) return;

    // Listen to member document changes in real-time
    const memberDocRef = doc(db, 'members', user.id);
    const unsubscribe = onSnapshot(memberDocRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        
        // If status changed to approved, refresh and redirect to dashboard
        if (data.status === 'approved') {
          toast({
            title: "Account Approved! 🎉",
            description: "Redirecting to dashboard...",
            duration: 2000,
          });
          
          // Refresh member data and go to dashboard
          await refreshMember();
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1500);
        }
        
        // If status changed to rejected, sign out
        if (data.status === 'rejected') {
          toast({
            title: "Account Rejected",
            description: "Your account request was not approved.",
            variant: "destructive",
            duration: 3000,
          });
          
          setTimeout(async () => {
            await signOut();
            navigate('/', { replace: true });
          }, 2000);
        }
      }
    });

    return () => unsubscribe();
  }, [user?.id, refreshMember, navigate, signOut]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-2xl">Pending Approval</CardTitle>
              <CardDescription className="mt-2">
                Your account is waiting for admin approval
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{member?.full_name}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking approval status automatically...</span>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Please wait for an administrator to approve your access.</p>
                <p className="mt-2">You'll be redirected automatically once approved.</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-center text-muted-foreground mb-3">
                  Contact your administrator if you've been waiting too long.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PendingApproval;
