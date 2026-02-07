import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Member } from '@/integrations/supabase/types';

export const useMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  const fetchMembers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setMembers(data || []);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (memberData: {
    full_name: string;
    email: string;
    mobile_number?: string;
    role?: 'admin' | 'member';
  }) => {
    if (!isAdmin) {
      throw new Error('Only admins can add members');
    }

    try {
      // Note: This would typically be handled by the Google OAuth flow
      // For manual member addition, you'd need to invite them via email
      const { data, error } = await supabase
        .from('members')
        .insert([memberData])
        .select()
        .single();

      if (error) throw error;

      setMembers(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error adding member:', err);
      throw err;
    }
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    if (!isAdmin) {
      throw new Error('Only admins can update members');
    }

    try {
      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setMembers(prev => prev.map(member => 
        member.id === id ? data : member
      ));
      return data;
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
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMembers(prev => prev.filter(member => member.id !== id));
    } catch (err: any) {
      console.error('Error deleting member:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  return {
    members,
    loading,
    error,
    addMember,
    updateMember,
    deleteMember,
    refetch: fetchMembers,
  };
};
