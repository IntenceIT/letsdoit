import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Member {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  mobile_number: string | null;
  created_at: string;
  role?: string;
}

export const useMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const userIds = (profiles || []).map(p => p.user_id);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const rolesMap: Record<string, string> = (roles || []).reduce(
        (acc: Record<string, string>, r: { user_id: string; role: string }) => {
          acc[r.user_id] = r.role;
          return acc;
        }, 
        {}
      );

      const membersWithRoles = (profiles || []).map(p => ({
        ...p,
        role: rolesMap[p.user_id] || 'user',
      }));

      setMembers(membersWithRoles);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMember = async (userId: string) => {
    try {
      // Delete from profiles (cascade will handle user_roles)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      await fetchMembers();
    } catch (err) {
      console.error('Error deleting member:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return {
    members,
    isLoading,
    error,
    refetch: fetchMembers,
    deleteMember,
  };
};
