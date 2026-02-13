import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  UserPlus, 
  Edit2, 
  Trash2, 
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckSquare,
  Square,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers, Member } from '@/hooks/useMembers';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const Members: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();
  const { members, isLoading, error, refetch, deleteMember, updateMember } = useMembers();

  const [searchQuery, setSearchQuery] = useState('');
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  // Separate pending and approved members
  const pendingMembers = members.filter(m => m.status === 'pending');
  const approvedMembers = members.filter(m => m.status === 'approved');

  // Redirect non-admins
  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  const displayMembers = showPendingOnly ? pendingMembers : approvedMembers;

  const filteredMembers = displayMembers.filter((member) =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendSMS = (member: Member) => {
    const message = `Your login credentials for Lets Do It:\nEmail: ${member.email}\nPlease contact admin for password.`;
    const smsUrl = `sms:${member.mobile_number || ''}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl);
  };

  const handleApproveMember = async (member: Member) => {
    try {
      await updateMember(member.id, { status: 'approved' });
      toast({
        title: 'Member Approved',
        description: `${member.full_name} can now access the app`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve member',
        variant: 'destructive',
      });
    }
  };

  const handleRejectMember = async (member: Member) => {
    try {
      await updateMember(member.id, { status: 'rejected' });
      toast({
        title: 'Member Rejected',
        description: `${member.full_name} has been rejected`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject member',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;

    setIsDeleting(true);
    try {
      await deleteMember(memberToDelete.id);
      toast({
        title: 'Member Deleted',
        description: `${memberToDelete.full_name} has been removed`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete member',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setMemberToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMembers.length === 0) return;

    setIsDeleting(true);
    try {
      for (const memberId of selectedMembers) {
        await deleteMember(memberId);
      }
      toast({
        title: 'Members Deleted',
        description: `${selectedMembers.length} members have been removed`,
      });
      setSelectedMembers([]);
      setBulkDeleteMode(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete some members',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
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
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/profile')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Team Members</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center justify-between mt-3">
            <Button
              variant={showPendingOnly ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowPendingOnly(!showPendingOnly)}
              className="gap-1"
            >
              <Clock className="w-4 h-4" />
              New Member {pendingMembers.length > 0 && `(${pendingMembers.length})`}
            </Button>
            <div className="flex items-center gap-2">
              {bulkDeleteMode && selectedMembers.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                >
                  Delete ({selectedMembers.length})
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBulkDeleteMode(!bulkDeleteMode);
                  setSelectedMembers([]);
                }}
              >
                {bulkDeleteMode ? 'Cancel' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Members List */}
      <div className="px-4 py-4 max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-8 h-8 text-destructive mb-2" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : filteredMembers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">
              {searchQuery ? 'No members match your search' : 'No team members yet'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {filteredMembers.map((member) => {
                const isCurrentUser = member.id === user?.id;
                const canDelete = !isCurrentUser && member.role !== 'admin';

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    layout
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {bulkDeleteMode && canDelete && (
                            <button
                              onClick={() => toggleMemberSelection(member.id)}
                              className="shrink-0"
                            >
                              {selectedMembers.includes(member.id) ? (
                                <CheckSquare className="w-5 h-5 text-primary" />
                              ) : (
                                <Square className="w-5 h-5 text-muted-foreground" />
                              )}
                            </button>
                          )}

                          <Avatar className="w-12 h-12 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground truncate">
                                {member.full_name}
                              </p>
                              {member.role === 'admin' && (
                                <Badge variant="secondary" className="text-2xs shrink-0">
                                  Admin
                                </Badge>
                              )}
                              {member.status === 'pending' && (
                                <Badge variant="outline" className="text-2xs shrink-0 border-yellow-500 text-yellow-600">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {member.email}
                            </p>
                            {member.mobile_number && (
                              <p className="text-xs text-muted-foreground">
                                {member.mobile_number}
                              </p>
                            )}
                          </div>

                          {!bulkDeleteMode && (
                            <div className="flex items-center gap-1">
                              {member.status === 'pending' ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleApproveMember(member)}
                                    title="Approve"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleRejectMember(member)}
                                    title="Reject"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  {member.mobile_number && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleSendSMS(member)}
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => navigate('/members/add', { state: { editMember: member } })}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  {canDelete && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => setMemberToDelete(member)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToDelete?.full_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Add Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-24 right-4 z-40"
      >
        <Button
          size="lg"
          onClick={() => navigate('/members/add')}
          className="h-14 w-14 rounded-full shadow-lg gap-1"
        >
          <UserPlus className="w-6 h-6" />
        </Button>
      </motion.div>

      <BottomNav />
    </div>
  );
};

export default Members;
