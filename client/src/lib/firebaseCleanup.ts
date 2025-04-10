/**
 * Firebase User Cleanup Utility
 * 
 * This utility provides functions to help clean up Firebase authentication users
 * when encountering errors like "auth/email-already-in-use".
 */

/**
 * Attempts to clean up a Firebase user by email
 * Only administrators can use this functionality
 * 
 * @param email The email of the Firebase user to clean up
 * @returns A Promise that resolves to the cleanup result
 */
export async function cleanupFirebaseUser(email: string): Promise<{
  success: boolean;
  message: string;
  firebaseUid?: string;
  databaseUserDeleted?: boolean;
  error?: string;
}> {
  try {
    // Get the admin token from localStorage
    const devUserJson = localStorage.getItem('dev-user');
    if (!devUserJson) {
      return {
        success: false,
        message: 'No authentication token available. You must be logged in as an admin.'
      };
    }

    const devUser = JSON.parse(devUserJson);
    if (!devUser || !devUser.firebaseUid || devUser.role !== 'admin') {
      return {
        success: false,
        message: 'You must be an admin to clean up Firebase users.'
      };
    }

    // Make API request to clean up the Firebase user
    const response = await fetch('/api/auth/cleanup-firebase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${devUser.firebaseUid}`
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: 'Firebase user cleaned up successfully.',
        firebaseUid: data.firebaseUid,
        databaseUserDeleted: data.databaseUserDeleted
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to clean up Firebase user.',
        error: data.error
      };
    }
  } catch (error: any) {
    console.error('Error cleaning up Firebase user:', error);
    return {
      success: false,
      message: 'Error cleaning up Firebase user.',
      error: error.message
    };
  }
}

/**
 * Helper function to recover from Firebase auth errors
 * 
 * @param error The Firebase auth error object
 * @param email The email that was being used
 * @returns A Promise that resolves to recovery information
 */
export async function recoverFromFirebaseError(
  error: any, 
  email: string
): Promise<{
  recovered: boolean;
  message: string;
  cleanupPerformed?: boolean;
}> {
  if (!error) {
    return { recovered: false, message: 'No error provided.' };
  }

  // Handle different Firebase error codes
  if (error.code === 'auth/email-already-in-use') {
    console.log(`Email ${email} is already in use. Attempting cleanup...`);
    
    const cleanupResult = await cleanupFirebaseUser(email);
    
    if (cleanupResult.success) {
      return {
        recovered: true,
        message: `Firebase user for ${email} was cleaned up successfully. You can try registering again.`,
        cleanupPerformed: true
      };
    } else {
      return {
        recovered: false,
        message: `Could not clean up Firebase user: ${cleanupResult.message || cleanupResult.error}. Please contact an administrator.`,
        cleanupPerformed: false
      };
    }
  }
  
  // For other errors, just return information
  return {
    recovered: false,
    message: `Firebase error: ${error.message || error.code || 'Unknown error'}`
  };
}