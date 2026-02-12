import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Mail, LogOut, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
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
    const unsubscribe = onSnapshot(memberDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        
        // If status changed to approved, show success and redirect
        if (data.status === 'approved') {
          toast({
            title: "Account Approved! 🎉",
            description: "Your account has been approved. Redirecting to login...",
            duration: 3000,
          });
          
          // Sign out and redirect to login
          setTimeout(async () => {
            await signOut();
            navigate('/', { replace: true });
          }, 2000);
        }
        
        // If status changed to rejected, sign out
        if (data.status === 'rejected') {
          toast({
            title: "Account Rejected",
            description: "Your account request was not approved. Please contact admin.",
            variant: "destructive",
            duration: 5000,
          });
          
          setTimeout(async () => {
            await signOut();
            navigate('/', { replace: true });
          }, 3000);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Clock className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Awaiting Admin Approval
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Your registration is under review
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 space-y-3 border border-blue-200 dark:border-gray-600">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-semibold text-foreground">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-semibold text-foreground">{member?.full_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-300 dark:border-amber-700">
                  <Clock className="w-3 h-3 animate-pulse" />
                  Pending Review
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm space-y-2">
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      What happens next?
                    </p>
                    <ul className="space-y-1.5 text-green-800 dark:text-green-200">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>An administrator will review your request</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Once approved, you'll be automatically logged out</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>Simply log in again to access the app</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0 animate-spin" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Real-time Status Monitoring
                    </p>
                    <p className="text-blue-800 dark:text-blue-200">
                      We're automatically checking your approval status. No need to refresh!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                      Taking too long?
                    </p>
                    <p className="text-orange-800 dark:text-orange-200">
                      Contact your administrator if you've been waiting for an extended period.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full border-2 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-700 transition-colors"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PendingApproval;
