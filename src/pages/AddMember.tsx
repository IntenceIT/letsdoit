import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, User, Mail, Phone, Lock, Eye, EyeOff, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  generateWhatsAppMessage, 
  openWhatsAppWithMessage, 
  generateMemberCredentials,
  validatePhoneNumber,
  type WhatsAppMessageData 
} from '@/lib/whatsapp';
import type { Member } from '@/integrations/supabase/types';

const AddMember: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin, member: currentMember } = useAuth();

  // Get edit member from navigation state
  const editMember = (location.state as { editMember?: Member })?.editMember;
  const isEditing = !!editMember;

  const [fullName, setFullName] = useState(editMember?.full_name || '');
  const [email, setEmail] = useState(editMember?.email || '');
  const [mobileNumber, setMobileNumber] = useState(editMember?.mobile_number || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-generate password for new members
  useEffect(() => {
    if (!isEditing && !password) {
      setPassword(generateMemberCredentials());
    }
  }, [isEditing, password]);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    let cleaned = value.replace(/\D/g, '');
    
    // Limit to 10 digits for Indian numbers
    if (cleaned.length > 10) {
      cleaned = cleaned.slice(-10);
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
    if (mobileNumber && !validatePhoneNumber(mobileNumber)) {
      return 'Please enter a valid 10-digit mobile number';
    }
    return null;
  };

  const sendWhatsAppInvitation = () => {
    if (!mobileNumber || !validatePhoneNumber(mobileNumber)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid mobile number to send WhatsApp message',
        variant: 'destructive',
      });
      return;
    }

    const messageData: WhatsAppMessageData = {
      memberName: fullName.trim(),
      memberEmail: email.trim(),
      memberPassword: password,
      memberPhone: mobileNumber,
      adminName: currentMember?.full_name || 'Admin',
      appUrl: window.location.origin,
    };

    const message = generateWhatsAppMessage(messageData);
    openWhatsAppWithMessage(mobileNumber, message);

    toast({
      title: 'WhatsApp Opened',
      description: 'WhatsApp opened with pre-filled message. Just click Send!',
    });
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
        // Update existing member
        const { error } = await supabase
          .from('members')
          .update({
            full_name: fullName.trim(),
            mobile_number: mobileNumber || null,
          })
          .eq('id', editMember.id);

        if (error) throw error;

        toast({
          title: 'Member Updated',
          description: 'Member information has been updated successfully',
        });
      } else {
        // Create new member via Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) throw error;

        toast({
          title: 'Member Created',
          description: 'New member has been added successfully',
        });

        // Show WhatsApp option if mobile number provided
        if (mobileNumber && validatePhoneNumber(mobileNumber)) {
          // Auto-open WhatsApp after successful creation
          setTimeout(() => {
            sendWhatsAppInvitation();
          }, 1000);
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

  const regeneratePassword = () => {
    setPassword(generateMemberCredentials());
    toast({
      title: 'Password Generated',
      description: 'New password has been generated',
    });
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
                <Label htmlFor="mobile">Mobile Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={mobileNumber}
                    onChange={handleMobileChange}
                    className="pl-10"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for WhatsApp invitation
                </p>
              </div>

              {/* Password (only for new members) */}
              {!isEditing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={regeneratePassword}
                      className="text-xs h-6 px-2"
                    >
                      Generate New
                    </Button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Auto-generated password"
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
                    Auto-generated secure password
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* WhatsApp Preview Card */}
        {!isEditing && mobileNumber && validatePhoneNumber(mobileNumber) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  WhatsApp Invitation Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border text-sm">
                  <div className="font-medium text-green-600 mb-1">To: +91{mobileNumber}</div>
                  <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                    {generateWhatsAppMessage({
                      memberName: fullName || 'Member',
                      memberEmail: email || 'email@example.com',
                      memberPassword: password || 'password',
                      memberPhone: mobileNumber,
                      adminName: currentMember?.full_name || 'Admin',
                      appUrl: window.location.origin,
                    })}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={sendWhatsAppInvitation}
                  className="w-full border-green-300 text-green-700 hover:bg-green-50"
                  disabled={!fullName || !email || !password}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send WhatsApp Message Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    WhatsApp Integration
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isEditing
                      ? "Update member details and optionally send WhatsApp notification."
                      : "After creating the member, WhatsApp will open with pre-filled credentials message. Just click Send!"}
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
          transition={{ delay: 0.3 }}
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
                {isEditing ? 'Update Member' : 'Create Member & Send WhatsApp'}
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
