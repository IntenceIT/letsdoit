import { useState, useEffect } from 'react';
import { membersService } from '@/integrations/firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import type { Member } from '@/integrations/firebase/types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

export type { Member };

export const useMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, member, isAdmin } = useAuth();

  // Calculate pending members count
  const pendingCount = members.filter(m => m.status === 'pending').length;

  const fetchMembers = async () => {
    if (!member?.organization_id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await membersService.getByOrganization(member.organization_id);
      setMembers(data || []);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    if (!isAdmin) {
      throw new Error('Only admins can update members');
    }

    try {
      await membersService.update(id, updates);
      const updatedMember = await membersService.getById(id);
      
      if (updatedMember) {
        setMembers(prev => prev.map(member => 
          member.id === id ? updatedMember : member
        ));
      }
      
      return updatedMember;
    } catch (err: any) {
      console.error('Error updating member:', err);
      throw err;
    }
  };

  const deleteMember = async (id: string) => {
    if (!isAdmin) {
      throw new Error('Only admins can delete members');
    }

    try {
      await membersService.delete(id);
      setMembers(prev => prev.filter(member => member.id !== id));
    } catch (err: any) {
      console.error('Error deleting member:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (!member?.organization_id) return;

    // Set up real-time listener for members
    const q = query(
      collection(db, 'members'),
      where('organization_id', '==', member.organization_id)
    );

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: false },
      (querySnapshot) => {
        const membersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Member));
        
        setMembers(membersData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error in members subscription:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [member?.organization_id]);

  return {
    members,
    loading,
    isLoading: loading,
    error,
    pendingCount,
    updateMember,
    deleteMember,
    refetch: fetchMembers,
  };
};
