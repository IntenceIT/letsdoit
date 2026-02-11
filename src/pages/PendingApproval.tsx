import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Mail, LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

const PendingApproval: React.FC = () => {
  const { user, member, signOut, refreshMember } = useAuth();
  const navigate = useNavigate();

  // Real-time listener for member status changes
  useEffect(() => {
    if (!user?.id) return;

    // Listen to member document changes in real-time
    const memberDocRef = doc(db, 'members', user.id);
    const unsubscribe = onSnapshot(memberDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        
        // If status changed to approved, refresh and redirect
        if (data.status === 'approved') {
          refreshMember().then(() => {
            navigate('/dashboard', { replace: true });
          });
        }
        
        // If status changed to rejected, sign out
        if (data.status === 'rejected') {
          signOut();
        }
      }
    });

    return () => unsubscribe();
  }, [user?.id, refreshMember, navigate, signOut]);

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-2">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-500 animate-pulse" />
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
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{member?.full_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-muted-foreground text-center">
                <p>Your account has been created successfully.</p>
                <p className="mt-2">
                  Please wait for an administrator to approve your access.
                  You'll be able to use the app once approved.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-primary">
                  <CheckCircle className="w-4 h-4 animate-pulse" />
                  <span>Checking status automatically...</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-center text-muted-foreground mb-3">
                  Contact your administrator if you've been waiting for a long time.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={signOut}
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
