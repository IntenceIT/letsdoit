import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, User, Mail, Phone, Lock, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Member } from '@/hooks/useMembers';

const AddMember: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  // Get edit member from navigation state
  const editMember = (location.state as { editMember?: Member })?.editMember;
  const isEditing = !!editMember;

  const [fullName, setFullName] = useState(editMember?.full_name || '');
  const [email, setEmail] = useState(editMember?.email || '');
  const [mobileNumber, setMobileNumber] = useState(editMember?.mobile_number || '+91');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits except +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +91
    if (!cleaned.startsWith('+91')) {
      cleaned = '+91' + cleaned.replace(/^\+/, '');
    }
    
    return cleaned;
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setMobileNumber(formatted);
  };

  const validateForm = (): string | null => {
    if (!fullName.trim()) return 'Full name is required';
    if (!email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
    if (!isEditing && !password) return 'Password is required';
    if (!isEditing && password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && editMember) {
        // Update existing member profile
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            email: email.trim(),
            mobile_number: mobileNumber.length > 3 ? mobileNumber : null,
          })
          .eq('user_id', editMember.user_id);

        if (error) throw error;

        toast({
          title: 'Member Updated',
          description: 'Member information has been updated',
        });

        // Offer to send SMS with updated info
        if (mobileNumber.length > 3) {
          const sendSMS = window.confirm('Send SMS with updated credentials?');
          if (sendSMS) {
            const message = `Your TaskFlow credentials have been updated:\nEmail: ${email}\nPlease contact admin for password if needed.`;
            window.open(`sms:${mobileNumber}?body=${encodeURIComponent(message)}`);
          }
        }
      } else {
        // Create new user via Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        // Update mobile number in profile if provided
        if (data.user && mobileNumber.length > 3) {
          await supabase
            .from('profiles')
            .update({ mobile_number: mobileNumber })
            .eq('user_id', data.user.id);
        }

        toast({
          title: 'Member Created',
          description: 'New member has been added successfully',
        });

        // Open SMS app with credentials
        if (mobileNumber.length > 3) {
          const message = `Welcome to TaskFlow!\nYour login credentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease login and change your password.`;
          window.open(`sms:${mobileNumber}?body=${encodeURIComponent(message)}`);
        }
      }

      navigate('/members');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save member',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-surface pb-20 safe-area-top">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-b border-border px-4 pt-6 pb-4"
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            {isEditing ? 'Edit Member' : 'Add New Member'}
          </h1>
        </div>
      </motion.header>

      {/* Form */}
      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Member Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Enter full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isEditing}
                  />
                </div>
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="+91 XXXXXXXXXX"
                    value={mobileNumber}
                    onChange={handleMobileChange}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Password (only for new members) */}
              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 characters
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    SMS Notification
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isEditing
                      ? "After saving, you'll be prompted to send updated credentials via SMS."
                      : "After creating the member, you'll be prompted to send login credentials via SMS."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-12 bg-gradient-hero hover:opacity-90 font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update Member' : 'Create Member'}
              </>
            )}
          </Button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddMember;
