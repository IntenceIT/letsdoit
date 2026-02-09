import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * Migration script to restructure members collection
 * Changes member document IDs from auto-generated to auth_user_id
 * This allows Firestore security rules to properly check admin status
 * 
 * WARNING: Run this only once and backup your data first!
 */
export async function migrateMembersToAuthUserId() {
  console.log('Starting members migration...');
  
  try {
    // Get all existing members
    const membersSnapshot = await getDocs(collection(db, 'members'));
    const members = membersSnapshot.docs.map(doc => ({
      oldId: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${members.length} members to migrate`);

    // Create new documents with auth_user_id as document ID
    for (const member of members) {
      const { oldId, auth_user_id, ...memberData } = member;
      
      // Create new document with auth_user_id as ID
      await setDoc(doc(db, 'members', auth_user_id), memberData);
      console.log(`Migrated member: ${oldId} -> ${auth_user_id}`);
    }

    console.log('Migration completed successfully!');
    console.log('Please verify the data before deleting old documents');
    
    return {
      success: true,
      migratedCount: members.length,
      members
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Clean up old member documents after verifying migration
 * Only run this after confirming the migration was successful
 */
export async function cleanupOldMemberDocuments(oldMemberIds: string[]) {
  console.log('Cleaning up old member documents...');
  
  try {
    for (const oldId of oldMemberIds) {
      await deleteDoc(doc(db, 'members', oldId));
      console.log(`Deleted old member document: ${oldId}`);
    }
    
    console.log('Cleanup completed!');
    return { success: true };
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
}
