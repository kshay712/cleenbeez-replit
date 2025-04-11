import { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import { 
  User as FirebaseUser,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  AuthError,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { recoverFromFirebaseError } from '@/lib/firebaseCleanup';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firebaseUid: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  emailVerified: boolean;
  register: (email: string, password: string, username: string, firebaseUid?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<boolean | void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void; // Added for direct login
  checkEmailVerificationStatus: () => Promise<boolean>; // Added for manual verification checks
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // First, check if we have a development user in localStorage
    const devUserJson = localStorage.getItem('dev-user');
    if (devUserJson) {
      try {
        const devUser = JSON.parse(devUserJson);
        console.log("Found development user in localStorage:", devUser);
        setUser(devUser);
        // For development users, assume email is verified
        setEmailVerified(true);
        setIsLoading(false);
        return () => {}; // No cleanup needed for localStorage
      } catch (error) {
        console.error("Error parsing dev user from localStorage:", error);
        localStorage.removeItem('dev-user');
      }
    }
    
    // If no dev user, proceed with regular Firebase auth
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Force refresh the token to get latest claims (especially email_verified claim)
          await firebaseUser.getIdToken(true);
          
          // Force reload to get latest user metadata - critical for email verification status
          await reload(firebaseUser);
          
          console.log("Auth state changed - Email verification status:", firebaseUser.emailVerified);
          
          // Check email verification status - consider Google auth users automatically verified
          setEmailVerified(
            firebaseUser.emailVerified || 
            firebaseUser.providerData.some(provider => provider.providerId === 'google.com')
          );
          
          // Get the user's ID token - already refreshed above so we can just get it
          const idToken = await firebaseUser.getIdToken();
          
          // Call the API to verify the token and get user data
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${idToken}`
            },
            credentials: 'include',
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log("User found in database:", userData);
            setUser(userData.user);
          } else {
            // If the user doesn't exist in our database, try to create them
            console.log("User not found in database, attempting to auto-create an account");
            try {
              // Call the Google auth endpoint which will create a user if needed
              const createResponse = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${idToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  email: firebaseUser.email,
                  firebaseUid: firebaseUser.uid,
                  username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.substring(0, 8)}`
                })
              });
              
              if (createResponse.ok) {
                const newUserData = await createResponse.json();
                console.log("User created successfully:", newUserData);
                setUser(newUserData.user);
                toast({
                  title: "Account Created",
                  description: "Your account has been automatically created.",
                });
              } else {
                console.error("Failed to create user account");
                const errorData = await createResponse.json();
                console.error(errorData);
                
                // If we can't create the user, sign them out
                await signOut(auth);
                setUser(null);
                toast({
                  variant: "destructive",
                  title: "Authentication Error",
                  description: errorData.message || "Could not create user account",
                });
              }
            } catch (error) {
              console.error("Error creating user:", error);
              await signOut(auth);
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Error verifying authentication:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        setEmailVerified(false);
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const register = async (email: string, password: string, username: string, firebaseUid?: string) => {
    try {
      setIsLoading(true);
      let idToken: string;
      let firebaseUser: FirebaseUser | null = null;
      let firebaseUid: string | undefined;
      
      // Check if we have pending Google registration data in session storage
      const pendingRegData = window?.sessionStorage?.getItem('pendingRegistration');
      
      if (pendingRegData) {
        try {
          const pendingRegistration = JSON.parse(pendingRegData);
          console.log("Found pending registration data:", pendingRegistration);
          
          // Use the data from pending registration
          if (pendingRegistration.email && !email) {
            email = pendingRegistration.email;
          }
          if (pendingRegistration.firebaseUid) {
            firebaseUid = pendingRegistration.firebaseUid;
            console.log("Using Firebase UID from pending registration:", firebaseUid);
          }
          
          // Clear the pending registration data
          sessionStorage.removeItem('pendingRegistration');
        } catch (error) {
          console.error("Error parsing pending registration data:", error);
        }
      }
      
      // If we don't have a Firebase UID from Google, create a new user
      if (!firebaseUid) {
        // Create the user in Firebase first
        console.log("Creating new Firebase user");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
        firebaseUid = firebaseUser.uid;
        console.log("Firebase user created:", firebaseUid);
        
        // Send email verification
        console.log("Sending email verification");
        await sendEmailVerification(firebaseUser);
        
        toast({
          title: "Verification Email Sent",
          description: "Please check your email to verify your account.",
        });
        
        idToken = await firebaseUser.getIdToken();
      } else {
        // For Google sign-in flow, we need to get the token from current user
        console.log("Using existing Firebase UID:", firebaseUid);
        if (auth.currentUser) {
          idToken = await auth.currentUser.getIdToken();
          firebaseUser = auth.currentUser;
        } else {
          // This is an edge case where we have a firebaseUid but no current user
          // Create a test token for development
          idToken = `test-${firebaseUid}`;
          console.log("Using test token for registration");
        }
      }
      
      // Register the user in our database
      console.log("Registering user with backend");
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          username,
          email,
          password: password || `firebase-auth-${Date.now()}`, // Use password if available or generate one
          firebaseUid: firebaseUid
        })
      });
      
      if (!response.ok) {
        // If our backend registration fails, delete the Firebase user to avoid orphaned accounts
        // But only if we created a new user (not for Google auth users)
        if (firebaseUser && !pendingRegData) {
          try {
            await firebaseUser.delete();
          } catch (deleteError) {
            console.error("Could not delete Firebase user after failed registration:", deleteError);
          }
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register with server');
      }
      
      const userData = await response.json();
      console.log("Backend registration successful:", userData);
      
      // Store user data
      setUser(userData.user);
      localStorage.setItem('dev-user', JSON.stringify(userData.user));
      
      return userData.user;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Check if this is a Firebase auth error
      if (error.code && error.code.startsWith('auth/')) {
        console.log(`Handling Firebase error: ${error.code}`);
        // Try to recover from the error
        const recovery = await recoverFromFirebaseError(error, email);
        
        if (recovery.recovered) {
          // If we successfully cleaned up the account, let the user know
          toast({
            title: "Account Cleanup",
            description: recovery.message,
          });
          
          // Add cleanupPerformed property to the error object to allow registration page to retry
          if (recovery.cleanupPerformed) {
            error.cleanupPerformed = true;
          }
          
          // Don't rethrow the error since we've handled it
          throw error; // Changed from return to throw, so RegisterPage can catch and retry
        } else {
          // If we couldn't recover, include the recovery message in the error
          error.message = recovery.message || error.message;
        }
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  

  
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Sign in with Firebase
      console.log("Signing in with Firebase:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Store Firebase user info for potential recovery
      storeFirebaseUser(firebaseUser);
      
      // Check if email is verified for email/password users
      if (!firebaseUser.emailVerified && !firebaseUser.providerData.some(provider => provider.providerId === 'google.com')) {
        console.log("Email not verified, sending verification email");
        
        // Send verification email
        await sendEmailVerification(firebaseUser);
        
        // Sign out the user
        await signOut(auth);
        
        toast({
          variant: "destructive",
          title: "Email Verification Required",
          description: "Please check your email to verify your account. A new verification email has been sent.",
        });
        
        throw new Error("Email verification required");
      }
      
      // Get token for verification with backend
      console.log("Firebase login successful, getting ID token");
      const idToken = await firebaseUser.getIdToken();
      
      // Check if user exists in our database
      console.log("Checking if user exists in our database");
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        // User found in database, use onAuthStateChanged flow
        console.log("User exists in database, continuing with normal flow");
        // The onAuthStateChanged listener will handle setting the user
      } else {
        // User not found in our database, needs explicit registration
        console.log("User not found in database, requires explicit registration");
        
        // Sign out from Firebase since the user is not registered with our system
        await signOut(auth);
        
        toast({
          variant: "destructive",
          title: "Registration Required",
          description: "Please register an account first before logging in.",
        });
        
        // Redirect to registration page
        if (typeof window !== 'undefined') {
          // Save email to prefill the registration form
          sessionStorage.setItem('pendingRegistration', JSON.stringify({
            email: firebaseUser.email
          }));
          window.location.href = '/register';
        }
        
        throw new Error("User not registered with our system");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Special handling for Firebase auth errors
      if (error.code && error.code.startsWith('auth/')) {
        console.log(`Handling Firebase login error: ${error.code}`);
        
        // Handle email-already-in-use errors specifically
        if (error.code === 'auth/email-already-in-use') {
          const recovery = await recoverFromFirebaseError(error, email);
          
          if (recovery.recovered) {
            toast({
              title: "Account Cleanup",
              description: recovery.message,
            });
            // Don't throw, the user can try again
            return;
          }
        }
      }
      
      throw new Error(error.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Handle the redirect result on page load
    const handleRedirectResult = async () => {
      try {
        // Check if this page load is the result of a redirect
        const result = await getRedirectResult(auth);
        
        if (result) {
          console.log("Got redirect result:", result);
          
          // User successfully signed in with redirect
          const firebaseUser = result.user;
          console.log("Firebase user:", firebaseUser);
          
          // Store user info for recovery and verification
          storeFirebaseUser(firebaseUser);
          
          try {
            // Get the user's ID token to authenticate with our backend
            const idToken = await firebaseUser.getIdToken();
            
            // Check if user exists in our database
            const response = await fetch('/api/auth/google', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              },
              body: JSON.stringify({
                email: firebaseUser.email,
                firebaseUid: firebaseUser.uid,
                username: firebaseUser.displayName || `user_${firebaseUser.uid.substring(0, 8)}`
              })
            });
            
            const responseData = await response.json();
            
            if (response.ok) {
              console.log("Backend user data:", responseData);
              
              // Manually set the user to bypass Firebase auth flow issues
              setUser(responseData.user);
              
              // Store in localStorage to persist login
              localStorage.setItem('dev-user', JSON.stringify(responseData.user));
              
              toast({
                title: "Success!",
                description: "Signed in with Google successfully!",
              });
            } else if (response.status === 404 && responseData.needsRegistration) {
              // User doesn't exist in our system yet, needs explicit registration
              console.log("User not found in system, needs registration:", responseData);
              
              // Store the Firebase user details temporarily to use during registration
              sessionStorage.setItem('pendingRegistration', JSON.stringify({
                email: firebaseUser.email,
                firebaseUid: firebaseUser.uid,
                displayName: firebaseUser.displayName || null
              }));
              
              // Sign out from Firebase since the user is not registered with our system
              await signOut(auth);
              
              // Redirect to registration page
              if (typeof window !== 'undefined') {
                window.location.href = '/register?source=google';
              }
              
              toast({
                title: "Registration Required",
                description: "Please complete your account setup to continue.",
              });
            } else {
              // Some other error occurred
              throw new Error(responseData.message || `Google sign-in failed: ${response.status} ${response.statusText}`);
            }
          } catch (err) {
            console.error("API error during Google auth:", err);
            toast({
              variant: "destructive",
              title: "Authentication Error",
              description: "Failed to complete Google authentication with our server"
            });
          }
        }
      } catch (error: any) {
        console.error("Google auth redirect error:", error);
        
        // Handle Firebase auth errors during redirect
        if (error.code && error.code.startsWith('auth/')) {
          console.log(`Handling Firebase error during Google redirect: ${error.code}`);
          
          // Get email from error or use a placeholder
          const email = error.customData?.email || "your account";
          
          if (error.code === 'auth/email-already-in-use') {
            const recovery = await recoverFromFirebaseError(error, email);
            
            if (recovery.recovered) {
              toast({
                title: "Account Cleanup",
                description: recovery.message,
              });
              return; // Let the user try again
            }
          }
        }
        
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message || "Failed to authenticate with Google",
        });
      }
    };
    
    handleRedirectResult();
  }, [toast]);

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      const provider = new GoogleAuthProvider();
      // Add scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      // Try popup first as it has better compatibility on most platforms
      try {
        console.log("Attempting Google sign-in with popup...");
        const result = await signInWithPopup(auth, provider);
        console.log("Popup sign-in successful:", result);
        
        // Extract user info
        const firebaseUser = result.user;
        
        // Store Firebase user info for potential recovery
        storeFirebaseUser(firebaseUser);
        
        const idToken = await firebaseUser.getIdToken();
        
        // Try to authenticate with our backend
        console.log("Authenticating with backend...");
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            email: firebaseUser.email,
            firebaseUid: firebaseUser.uid,
            username: firebaseUser.displayName || `user_${firebaseUser.uid.substring(0, 8)}`
          })
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
          console.log("Backend returned user data:", responseData);
          
          // Set the user in state
          setUser(responseData.user);
          
          // Also store in localStorage as backup
          localStorage.setItem('dev-user', JSON.stringify(responseData.user));
          
          toast({
            title: "Success!",
            description: "Signed in with Google successfully!",
          });
        } else if (response.status === 404 && responseData.needsRegistration) {
          // User doesn't exist in our system yet, needs explicit registration
          console.log("User not found in system, needs registration:", responseData);
          
          // Store the Firebase user details temporarily to use during registration
          sessionStorage.setItem('pendingRegistration', JSON.stringify({
            email: firebaseUser.email,
            firebaseUid: firebaseUser.uid,
            displayName: firebaseUser.displayName || null
          }));
          
          // Redirect to registration page
          if (typeof window !== 'undefined') {
            window.location.href = '/register?source=google';
          }
          
          toast({
            title: "Registration Required",
            description: "Please complete your account setup to continue.",
          });
          
          return false; // Registration needed
        } else {
          // Some other error occurred
          throw new Error(responseData.message || `Google sign-in failed: ${response.status} ${response.statusText}`);
        }
        
        return true; // Successfully logged in
      } catch (popupError) {
        console.error("Popup sign-in failed, falling back to redirect:", popupError);
        
        // Fall back to redirect if popup fails
        // This will cause a page reload and the redirect result will be handled by the useEffect
        await signInWithRedirect(auth, provider);
        return false; // Redirect initiated, no result yet
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Handle Firebase auth errors in Google auth flow
      if (error.code && error.code.startsWith('auth/')) {
        console.log(`Handling Firebase error during Google login: ${error.code}`);
        
        // Get email from error or just use a placeholder for messaging
        const email = error.customData?.email || "your account";
        
        if (error.code === 'auth/email-already-in-use') {
          const recovery = await recoverFromFirebaseError(error, email);
          
          if (recovery.recovered) {
            toast({
              title: "Account Cleanup",
              description: recovery.message,
            });
            setIsLoading(false);
            return false; // User can try again
          }
        }
      }
      
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Failed to start Google login",
      });
      setIsLoading(false);
      throw error;
    } finally {
      // Only set loading to false if we're not doing a redirect
      // (redirect will reload the page anyway)
      if (typeof window !== 'undefined' && window.location.href === document.referrer) {
        setIsLoading(false);
      }
    }
  };
  
  const logout = async () => {
    try {
      setIsLoading(true);
      console.log("Starting logout process");
      
      // Always call the backend logout endpoint to clear server session
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        console.log("Server session cleared successfully");
      } catch (error) {
        console.error("Error clearing server session:", error);
        // Continue with client-side logout even if server logout fails
      }
      
      // Check if we have a development user in localStorage
      if (localStorage.getItem('dev-user')) {
        console.log("Found development user, clearing from localStorage");
        localStorage.removeItem('dev-user');
      }
      
      // Clear any stored Firebase credentials
      localStorage.removeItem('firebase-credentials');
      localStorage.removeItem('firebase-current-user');
      console.log("Cleared stored Firebase credentials");
      
      // If the user is authenticated with Firebase, sign them out
      if (auth.currentUser) {
        console.log("Signing out from Firebase");
        await signOut(auth);
      }
      
      // Always manually clear the user state and reset verification status
      setUser(null);
      setEmailVerified(false);
      
      console.log("Logout complete");
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Even if there's an error, try to clean up as much as possible
      localStorage.removeItem('dev-user');
      setUser(null);
      setEmailVerified(false);
      
      // Re-throw for UI error handling
      throw new Error(error.message || 'Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };
  
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'editor' || isAdmin;
  
  // Add email verification polling
  const verificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Periodically check if email has been verified
  useEffect(() => {
    // Debug logs to help track what's happening
    console.log("Verification effect running. User:", !!user, "EmailVerified:", emailVerified, "Auth Current User:", !!auth.currentUser);
    
    // Only poll if user is logged in but email is not verified
    if (user && !emailVerified) {
      console.log("Starting email verification polling...");
      
      // Track the current verification status
      const currentVerificationStatus = auth.currentUser?.emailVerified || false;
      console.log("Current user email verified status:", currentVerificationStatus);
      
      const checkEmailVerification = async () => {
        try {
          console.log("Checking for email verification status...");
          
          // First approach: Standard Firebase reload if we have a current user
          if (auth.currentUser) {
            try {
              console.log("Before reload - Email verified:", auth.currentUser.emailVerified);
              
              // Get a fresh token to force metadata refresh
              await auth.currentUser.getIdToken(true);
              // Then reload the user
              await reload(auth.currentUser);
              
              console.log("After reload - Email verified:", auth.currentUser.emailVerified);
              
              // Check if email is now verified
              if (auth.currentUser.emailVerified) {
                console.log("Email has been verified via Firebase reload!");
                setEmailVerified(true);
                
                // Show success message
                toast({
                  title: "Email Verified!",
                  description: "Your email has been verified. You now have full access to all features.",
                  variant: "default",
                });
                
                // Stop polling
                if (verificationTimerRef.current) {
                  clearInterval(verificationTimerRef.current);
                  verificationTimerRef.current = null;
                }
                
                // Check if there's a redirect route stored
                const intendedRoute = sessionStorage.getItem('intendedRoute');
                if (intendedRoute) {
                  console.log(`Redirecting to intended route: ${intendedRoute}`);
                  sessionStorage.removeItem('intendedRoute');
                  
                  // Small delay to ensure toast is visible
                  setTimeout(() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = intendedRoute;
                    }
                  }, 1500);
                }
                
                return; // Exit after successful verification
              }
            } catch (reloadError) {
              console.error("Error during Firebase reload:", reloadError);
              // Continue to backup approach
            }
          }
          
          // Second approach: Use our backend verification API
          try {
            // Get credentials from localStorage
            const storedCredentials = localStorage.getItem('firebase-credentials');
            if (storedCredentials && user.email) {
              const credentials = JSON.parse(storedCredentials);
              console.log("Using stored credentials for verification check");
              
              // Call backend API
              const response = await fetch(`/api/auth/check-verification?email=${encodeURIComponent(user.email)}&uid=${credentials.uid}`, {
                method: 'GET',
                headers: {
                  'x-firebase-check': 'true',
                  'x-dev-user-id': user.id.toString()
                }
              });
              
              if (response.ok) {
                const result = await response.json();
                console.log("Backend verification check result:", result);
                
                if (result.emailVerified) {
                  console.log("Email verified according to backend check!");
                  setEmailVerified(true);
                  
                  toast({
                    title: "Email Verified!",
                    description: "Your email has been verified. You now have full access to all features.",
                    variant: "default",
                  });
                  
                  // Stop polling
                  if (verificationTimerRef.current) {
                    clearInterval(verificationTimerRef.current);
                    verificationTimerRef.current = null;
                  }
                  
                  // Check if there's a redirect route stored
                  const intendedRoute = sessionStorage.getItem('intendedRoute');
                  if (intendedRoute) {
                    console.log(`Redirecting to intended route: ${intendedRoute}`);
                    sessionStorage.removeItem('intendedRoute');
                    
                    // Small delay to ensure toast is visible
                    setTimeout(() => {
                      if (typeof window !== 'undefined') {
                        window.location.href = intendedRoute;
                      }
                    }, 1500);
                  }
                }
              }
            }
          } catch (backendError) {
            console.error("Error during backend verification check:", backendError);
          }
        } catch (error) {
          console.error("Error checking email verification:", error);
        }
      };
      
      // Poll every 3 seconds (reduced from 5 for faster checking)
      verificationTimerRef.current = setInterval(checkEmailVerification, 3000);
      
      // Also check immediately
      checkEmailVerification();
      
      return () => {
        console.log("Cleaning up verification timer in useEffect");
        if (verificationTimerRef.current) {
          clearInterval(verificationTimerRef.current);
          verificationTimerRef.current = null;
        }
      };
    } else if (emailVerified || !user) {
      // Clean up timer if user becomes verified or logs out
      console.log("User verified or not present, clearing timer");
      if (verificationTimerRef.current) {
        clearInterval(verificationTimerRef.current);
        verificationTimerRef.current = null;
      }
    }
  }, [user, emailVerified, toast]);
  
  // Store Firebase user and credentials in localStorage for recovery
  const storeFirebaseUser = (firebaseUser: any) => {
    try {
      if (firebaseUser) {
        // Store user info for later use
        const userInfo = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          createdAt: Date.now()
        };
        localStorage.setItem('firebase-current-user', JSON.stringify(userInfo));
        
        // Also store credentials for verification recovery
        const credentialInfo = {
          email: firebaseUser.email || '',
          uid: firebaseUser.uid,
          timestamp: Date.now()
        };
        localStorage.setItem('firebase-credentials', JSON.stringify(credentialInfo));
        console.log("Firebase user and credentials stored for recovery");
      }
    } catch (error) {
      console.error("Error storing Firebase user info:", error);
    }
  };
  
  // Manual check method for email verification
  const checkEmailVerificationStatus = async () => {
    console.log("Manually checking email verification status...");
    
    // First check if we have a current Firebase user
    if (auth.currentUser) {
      try {
        console.log("Firebase user exists in auth.currentUser, checking verification...");
        
        // Store the current user info for recovery if needed
        storeFirebaseUser(auth.currentUser);
        
        // First, force token refresh to get latest claims
        try {
          await auth.currentUser.getIdToken(true);
          console.log("Token refreshed successfully");
        } catch (tokenError) {
          console.error("Error refreshing token:", tokenError);
        }
        
        // Then reload user to get latest metadata
        await reload(auth.currentUser);
        
        console.log("Current user email verification status:", auth.currentUser.emailVerified);
        
        // Check if email is now verified
        if (auth.currentUser.emailVerified) {
          console.log("Email verified during manual check!");
          
          // Update state in our app
          setEmailVerified(true);
          
          // Update the user record in our database (through API) - Optional but good practice
          try {
            // Make API call to update the user's verification status
            const idToken = await auth.currentUser.getIdToken();
            const response = await fetch('/api/auth/me', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            });
            
            if (response.ok) {
              console.log("Successfully updated user profile after verification");
            }
          } catch (apiError) {
            console.error("Error updating user profile after verification:", apiError);
            // Non-critical error, don't prevent verification success
          }
          
          // Show success message
          toast({
            title: "Email Verified!",
            description: "Your email has been verified. You now have full access to all features.",
            variant: "default",
          });
          
          // Handle redirect after verification
          handleVerificationRedirect();
          
          return true;
        } else {
          console.log("Email not verified in manual check");
          return false;
        }
      } catch (error) {
        console.error("Error during manual verification check:", error);
        return false;
      }
    } 
    // If no current Firebase user but we have a user in our app state
    else if (user) {
      console.log("No Firebase user, but app has authenticated user. Attempting verification with stored user info...");
      
      // Try all possible sources of stored Firebase user information
      let firebaseCredentials = null;
      let firebaseUid = null;
      let email = user.email;
      
      try {
        // Option 1: Get from firebase-current-user
        const storedUserJson = localStorage.getItem('firebase-current-user');
        if (storedUserJson) {
          const storedUser = JSON.parse(storedUserJson);
          console.log("Found stored Firebase user info:", storedUser);
          if (storedUser.uid) {
            firebaseUid = storedUser.uid;
          }
        }
        
        // Option 2: Get from firebase-credentials
        if (!firebaseUid) {
          const storedCredsJson = localStorage.getItem('firebase-credentials');
          if (storedCredsJson) {
            firebaseCredentials = JSON.parse(storedCredsJson);
            console.log("Found stored Firebase credentials:", firebaseCredentials);
            if (firebaseCredentials.uid) {
              firebaseUid = firebaseCredentials.uid;
            }
          }
        }
        
        // Option 3: Use user.firebaseUid directly if available
        if (!firebaseUid && user.firebaseUid) {
          console.log("Using firebaseUid from user object:", user.firebaseUid);
          firebaseUid = user.firebaseUid;
        }
        
        // If still no Firebase UID, we can't verify
        if (!firebaseUid) {
          console.log("No Firebase UID found in any stored credentials");
          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: "Could not find your Firebase user ID. Please refresh and log in again.",
          });
          return false;
        }
        
        // We have a uid, so try backend verification regardless of source
        if (email) {
          console.log(`Calling backend to check verification with email: ${email}, uid: ${firebaseUid}`);
          try {
            const response = await fetch(`/api/auth/check-verification?email=${encodeURIComponent(email)}&uid=${firebaseUid}`, {
              method: 'GET',
              headers: {
                'x-firebase-check': 'true',
                'x-dev-user-id': user.id ? user.id.toString() : '' // Include user ID if available
              }
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log("Backend verification check result:", result);
              
              if (result.emailVerified) {
                console.log("Email verified according to backend check!");
                setEmailVerified(true);
                
                toast({
                  title: "Email Verified!",
                  description: "Your email has been verified. You now have full access to all features.",
                  variant: "default",
                });
                
                // Handle redirect after verification
                handleVerificationRedirect();
                
                return true;
              } else if (result.uidMismatch) {
                // Special case: Firebase found a user with this email but different UID
                console.log("Email found but UID mismatch:", result.user);
                toast({
                  variant: "destructive",
                  title: "Account Mismatch",
                  description: "We found your email but with a different account. Please log out and log in again.",
                });
                return false;
              } else {
                console.log("Email not verified according to backend check");
                toast({
                  title: "Not Verified Yet",
                  description: "Your email is not verified yet. Please check your inbox and click the verification link.",
                  variant: "default",
                });
                return false;
              }
            } else {
              console.error("Error from backend verification check:", await response.text());
              
              // Show helpful error message
              toast({
                variant: "destructive",
                title: "Verification Check Failed",
                description: "Server couldn't verify your email. Please try again later.",
              });
              
              return false;
            }
          } catch (backendError) {
            console.error("Error checking verification with backend:", backendError);
            toast({
              variant: "destructive",
              title: "Server Error",
              description: "Could not connect to verification service. Please try again later.",
            });
            return false;
          }
        } else {
          console.log("No email found to check verification");
          toast({
            variant: "destructive",
            title: "Missing Email",
            description: "Could not determine your email address. Please refresh and try again.",
          });
          return false;
        }
      } catch (error) {
        console.error("Error during alternative verification check:", error);
        toast({
          variant: "destructive",
          title: "Verification Error",
          description: "An unexpected error occurred. Please refresh and try again.",
        });
        return false;
      }
    } else {
      console.log("No authenticated user found to check verification");
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to verify your email.",
      });
      return false;
    }
  };
  
  // Helper function to handle redirects after successful verification
  const handleVerificationRedirect = () => {
    // First check for the redirect after verification path
    let redirectPath = sessionStorage.getItem('redirectAfterVerification');
    
    // If no specific redirect path, check for intended route
    if (!redirectPath) {
      redirectPath = sessionStorage.getItem('intendedRoute');
    }
    
    if (redirectPath) {
      console.log(`Redirecting to: ${redirectPath}`);
      // Clear stored paths
      sessionStorage.removeItem('redirectAfterVerification');
      sessionStorage.removeItem('intendedRoute');
      
      // Small delay to ensure toast is visible
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = redirectPath;
        }
      }, 1500);
    }
  };
  
  const value = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isEditor,
    emailVerified,
    register,
    login,
    loginWithGoogle,
    logout,
    setUser,  // Expose setUser for direct login
    checkEmailVerificationStatus // Add manual verification check
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
