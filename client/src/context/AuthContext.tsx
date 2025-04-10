import { createContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";

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
  register: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<boolean | void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void; // Added for direct login
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // First, check if we have a development user in localStorage
    const devUserJson = localStorage.getItem('dev-user');
    if (devUserJson) {
      try {
        const devUser = JSON.parse(devUserJson);
        console.log("Found development user in localStorage:", devUser);
        setUser(devUser);
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
          // Get the user's ID token
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
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const register = async (email: string, password: string, username: string) => {
    try {
      setIsLoading(true);
      
      // Create the user in Firebase first
      console.log("Creating Firebase user");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log("Firebase user created:", firebaseUser.uid);
      // Get the token for authentication
      const idToken = await firebaseUser.getIdToken();
      
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
          password, // We'll need this for our database schema
          firebaseUid: firebaseUser.uid
        })
      });
      
      if (!response.ok) {
        // If our backend registration fails, delete the Firebase user to avoid orphaned accounts
        try {
          await firebaseUser.delete();
        } catch (deleteError) {
          console.error("Could not delete Firebase user after failed registration:", deleteError);
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
        // User not found in our database, try to create them
        console.log("User not found in database, creating account automatically");
        
        try {
          // Create user in our database 
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
            const userData = await createResponse.json();
            console.log("User created in our database:", userData);
            
            // Set the user data
            setUser(userData.user);
            localStorage.setItem('dev-user', JSON.stringify(userData.user));
            
            toast({
              title: "Account Created",
              description: "Your account has been set up in our system."
            });
          } else {
            const errorData = await createResponse.json();
            console.error("Failed to create user in database:", errorData);
            throw new Error(errorData.message || "Failed to create user in our system");
          }
        } catch (createError: any) {
          console.error("Error creating user in database:", createError);
          throw new Error(createError.message || "Failed to register with our system");
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
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
          
          try {
            // Get the user's ID token to authenticate with our backend
            const idToken = await firebaseUser.getIdToken();
            
            // Check if user exists in our database, if not, create them
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
            
            if (!response.ok) {
              throw new Error(`Google sign-in failed: ${response.status} ${response.statusText}`);
            }
            
            const userData = await response.json();
            console.log("Backend user data:", userData);
            
            // Manually set the user to bypass Firebase auth flow issues
            setUser(userData.user);
            
            // Store in localStorage to persist login
            localStorage.setItem('dev-user', JSON.stringify(userData.user));
            
            toast({
              title: "Success!",
              description: "Signed in with Google successfully!",
            });
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
        const idToken = await firebaseUser.getIdToken();
        
        // Register with our backend
        console.log("Registering with backend...");
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
        
        if (!response.ok) {
          throw new Error(`Google sign-in failed: ${response.status} ${response.statusText}`);
        }
        
        const userData = await response.json();
        console.log("Backend returned user data:", userData);
        
        // Set the user in state
        setUser(userData.user);
        
        // Also store in localStorage as backup
        localStorage.setItem('dev-user', JSON.stringify(userData.user));
        
        toast({
          title: "Success!",
          description: "Signed in with Google successfully!",
        });
        
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
      
      // If the user is authenticated with Firebase, sign them out
      if (auth.currentUser) {
        console.log("Signing out from Firebase");
        await signOut(auth);
      }
      
      // Always manually clear the user state
      setUser(null);
      
      console.log("Logout complete");
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Even if there's an error, try to clean up as much as possible
      localStorage.removeItem('dev-user');
      setUser(null);
      
      // Re-throw for UI error handling
      throw new Error(error.message || 'Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };
  
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'editor' || isAdmin;
  
  const value = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isEditor,
    register,
    login,
    loginWithGoogle,
    logout,
    setUser  // Expose setUser for direct login
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
