import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type {
  Organization,
  Member,
  Task,
  TaskAssignment,
  OrganizationInsert,
  MemberInsert,
  TaskInsert,
  TaskAssignmentInsert,
} from './types';

// Collection names
const COLLECTIONS = {
  ORGANIZATIONS: 'organizations',
  MEMBERS: 'members',
  TASKS: 'tasks',
  TASK_ASSIGNMENTS: 'task_assignments',
};

// Organizations
export const organizationsService = {
  async create(data: OrganizationInsert): Promise<Organization> {
    const docRef = await addDoc(collection(db, COLLECTIONS.ORGANIZATIONS), {
      ...data,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as Organization;
  },

  async getById(id: string): Promise<Organization | null> {
    const docRef = doc(db, COLLECTIONS.ORGANIZATIONS, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Organization : null;
  },

  async getAll(): Promise<Organization[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.ORGANIZATIONS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Organization));
  },
};

// Members
export const membersService = {
  async create(data: MemberInsert): Promise<Member> {
    // Use auth_user_id as document ID for better security rules
    const docRef = doc(db, COLLECTIONS.MEMBERS, data.auth_user_id);
    await setDoc(docRef, {
      ...data,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as Member;
  },

  async getById(id: string): Promise<Member | null> {
    const docRef = doc(db, COLLECTIONS.MEMBERS, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Member : null;
  },

  async getByAuthUserId(authUserId: string): Promise<Member | null> {
    // Now we can directly get by document ID since we use auth_user_id as ID
    const docRef = doc(db, COLLECTIONS.MEMBERS, authUserId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Member : null;
  },

  async getByEmail(email: string): Promise<Member | null> {
    const q = query(
      collection(db, COLLECTIONS.MEMBERS),
      where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Member;
  },

  async getByOrganization(organizationId: string): Promise<Member[]> {
    const q = query(
      collection(db, COLLECTIONS.MEMBERS),
      where('organization_id', '==', organizationId),
      orderBy('created_at', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
  },

  async update(id: string, data: Partial<MemberInsert>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.MEMBERS, id);
    await updateDoc(docRef, {
      ...data,
      updated_at: Timestamp.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.MEMBERS, id));
  },
};

// Tasks
export const tasksService = {
  async create(data: TaskInsert): Promise<Task> {
    const docRef = await addDoc(collection(db, COLLECTIONS.TASKS), {
      ...data,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as Task;
  },

  async getById(id: string): Promise<Task | null> {
    const docRef = doc(db, COLLECTIONS.TASKS, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Task : null;
  },

  async getByOrganization(organizationId: string): Promise<Task[]> {
    const q = query(
      collection(db, COLLECTIONS.TASKS),
      where('organization_id', '==', organizationId),
      orderBy('created_at', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  },

  subscribeToOrganization(organizationId: string, callback: (tasks: Task[]) => void): () => void {
    const q = query(
      collection(db, COLLECTIONS.TASKS),
      where('organization_id', '==', organizationId),
      orderBy('created_at', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      callback(tasks);
    });
    
    return unsubscribe;
  },

  async update(id: string, data: Partial<TaskInsert>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TASKS, id);
    await updateDoc(docRef, {
      ...data,
      updated_at: Timestamp.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.TASKS, id));
  },
};

// Task Assignments
export const taskAssignmentsService = {
  async create(data: TaskAssignmentInsert): Promise<TaskAssignment> {
    const docRef = await addDoc(collection(db, COLLECTIONS.TASK_ASSIGNMENTS), {
      ...data,
      created_at: Timestamp.now(),
    });
    const docSnap = await getDoc(docRef);
    return { id: docRef.id, ...docSnap.data() } as TaskAssignment;
  },

  async getById(id: string): Promise<TaskAssignment | null> {
    const docRef = doc(db, COLLECTIONS.TASK_ASSIGNMENTS, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as TaskAssignment : null;
  },

  async getByMemberAndDate(memberId: string, date: string): Promise<TaskAssignment[]> {
    const q = query(
      collection(db, COLLECTIONS.TASK_ASSIGNMENTS),
      where('member_id', '==', memberId),
      where('assigned_date', '==', date)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskAssignment));
  },

  async getByTask(taskId: string): Promise<TaskAssignment[]> {
    const q = query(
      collection(db, COLLECTIONS.TASK_ASSIGNMENTS),
      where('task_id', '==', taskId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskAssignment));
  },

  async getByTaskAndDate(taskId: string, date: string): Promise<TaskAssignment[]> {
    const q = query(
      collection(db, COLLECTIONS.TASK_ASSIGNMENTS),
      where('task_id', '==', taskId),
      where('assigned_date', '==', date)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskAssignment));
  },

  subscribeToDate(date: string, callback: (assignments: TaskAssignment[]) => void): () => void {
    const q = query(
      collection(db, COLLECTIONS.TASK_ASSIGNMENTS),
      where('assigned_date', '==', date)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const assignments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskAssignment));
      callback(assignments);
    });
    
    return unsubscribe;
  },

  async update(id: string, data: Partial<TaskAssignmentInsert>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TASK_ASSIGNMENTS, id);
    await updateDoc(docRef, data);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.TASK_ASSIGNMENTS, id));
  },
};

// Helper function to check if user is admin
export const isAdmin = async (userId: string): Promise<boolean> => {
  const member = await membersService.getByAuthUserId(userId);
  return member?.role === 'admin';
};

// Helper function to get user's organization
export const getUserOrganization = async (userId: string): Promise<string | null> => {
  const member = await membersService.getByAuthUserId(userId);
  return member?.organization_id || null;
};
