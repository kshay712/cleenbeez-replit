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
  loginWithGoogle: () => Promise<void>;
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
            setUser(userData);
          } else {
            // If the user doesn't exist in our database,
            // we'll sign them out from Firebase
            await signOut(auth);
            setUser(null);
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
      
      // Create the user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Register the user in our database
      const response = await apiRequest('POST', '/api/auth/register', {
        username,
        email,
        firebaseUid: firebaseUser.uid
      });
      
      const userData = await response.json();
      setUser(userData);
      
      return userData;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };
  
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Sign in with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // The onAuthStateChanged listener will handle setting the user
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
          // User successfully signed in with redirect
          const firebaseUser = result.user;
          
          // Check if user exists in our database, if not, create them
          await apiRequest('POST', '/api/auth/google', {
            email: firebaseUser.email,
            firebaseUid: firebaseUser.uid,
            username: firebaseUser.displayName || `user_${firebaseUser.uid.substring(0, 8)}`
          });
          
          toast({
            title: "Success!",
            description: "Signed in with Google successfully!",
          });
          
          // The onAuthStateChanged listener will handle setting the user
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
      
      // Use redirect method instead of popup for better compatibility
      await signInWithRedirect(auth, provider);
      
      // The result will be handled in the useEffect above when the page reloads
      // No need to set anything here as the page will refresh
    } catch (error: any) {
      console.error('Google login error:', error);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Failed to start Google login",
      });
      setIsLoading(false);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Sign out from Firebase
      await signOut(auth);
      
      // The onAuthStateChanged listener will handle clearing the user
    } catch (error: any) {
      console.error('Logout error:', error);
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
