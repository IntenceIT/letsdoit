import { Timestamp } from 'firebase/firestore';

// Organization type
export interface Organization {
  id: string;
  organization_name: string;
  created_by_admin_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Member type
export interface Member {
  id: string;
  auth_user_id: string;
  organization_id: string;
  full_name: string;
  email: string;
  role: string;
  mobile_number: string | null;
  last_login_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Task type
export interface Task {
  id: string;
  organization_id: string;
  task_title: string;
  task_description: string | null;
  remarks: string | null;
  task_type: 'permanent' | 'additional';
  requires_ai_count: boolean;
  weekdays: string[] | null;
  start_date: string | null;
  end_date: string | null;
  assigned_by_admin: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Task Assignment type
export interface TaskAssignment {
  id: string;
  task_id: string;
  member_id: string;
  assigned_date: string;
  completion_status: 'pending' | 'completed' | 'not_done';
  ai_count_value: string | null;
  completed_at: Timestamp | null;
  created_at: Timestamp;
}

// Insert types (for creating new documents)
export type OrganizationInsert = Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
export type MemberInsert = Omit<Member, 'id' | 'created_at' | 'updated_at'>;
export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'>;
export type TaskAssignmentInsert = Omit<TaskAssignment, 'id' | 'created_at'>;

// Update types (for updating documents)
export type OrganizationUpdate = Partial<OrganizationInsert>;
export type MemberUpdate = Partial<MemberInsert>;
export type TaskUpdate = Partial<TaskInsert>;
export type TaskAssignmentUpdate = Partial<TaskAssignmentInsert>;
