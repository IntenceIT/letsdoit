import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [userName, setUserName] = useState('');

  const handleGoogleSignIn = async () => {
    setShowNameDialog(true);
  };

  const handleNameSubmit = async () => {
    if (!userName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name to continue',
        variant: 'destructive',
      });
      return;
    }

    setIsGoogleLoading(true);

    try {
      const result = await signInWithGoogle(userName);

      if (result.success) {
        setShowNameDialog(false);
        if (result.status === 'pending') {
          toast({
            title: 'Account Created!',
            description: 'Waiting for admin approval',
          });
        } else {
          toast({
            title: 'Welcome!',
            description: 'Successfully signed in with Google',
          });
        }
      } else {
        toast({
          title: 'Sign In Failed',
          description: result.error || 'Failed to sign in with Google',
          variant: 'destructive',
        });
        setShowNameDialog(false);
      }
    } catch (error: any) {
      toast({
        title: 'Sign In Failed',
        description: error.message || 'An error occurred during Google sign in',
        variant: 'destructive',
      });
      setShowNameDialog(false);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4 safe-area-top safe-area-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-hero shadow-glow mb-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-8 h-8 text-white"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">Lets Do It</h1>
          <p className="text-muted-foreground mt-1">Manage your tasks efficiently</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>Sign in to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 hover:bg-accent"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>

      {/* Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={(open) => {
        setShowNameDialog(open);
        if (!open) setUserName('');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome! What's your name?</DialogTitle>
            <DialogDescription>
              Please enter your full name before signing in with Google
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="userName"
                  placeholder="Enter your full name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleNameSubmit();
                  }}
                  autoFocus
                />
              </div>
            </div>
            <Button
              onClick={handleNameSubmit}
              disabled={isGoogleLoading || !userName.trim()}
              className="w-full"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in with Google...
                </>
              ) : (
                'Continue with Google'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
