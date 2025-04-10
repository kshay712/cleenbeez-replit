import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import BeeIcon from "@/components/icons/BeeIcon";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Schema for normal registration
const normalRegisterSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Special schema for Google registration (no password required)
const googleRegisterSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
});

type NormalRegisterFormValues = z.infer<typeof normalRegisterSchema>;
type GoogleRegisterFormValues = z.infer<typeof googleRegisterSchema>;

const RegisterPage = () => {
  const [, navigate] = useLocation();
  const { register, loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleRegistration, setIsGoogleRegistration] = useState(false);
  const [pendingData, setPendingData] = useState<{
    email?: string;
    firebaseUid?: string;
    displayName?: string | null;
  } | null>(null);
  const { toast } = useToast();
  
  // Check for Google registration data in session storage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isFromGoogle = params.get('source') === 'google';
    
    if (isFromGoogle) {
      setIsGoogleRegistration(true);
    }
    
    const pendingRegData = window?.sessionStorage?.getItem('pendingRegistration');
    if (pendingRegData) {
      try {
        const data = JSON.parse(pendingRegData);
        setPendingData(data);
        
        // Pre-fill the form with the pending data
        form.setValue('email', data.email || '');
        if (data.displayName) {
          const suggestedUsername = data.displayName.replace(/\s+/g, '') || 
            data.email?.split('@')[0] || '';
          form.setValue('username', suggestedUsername);
        }
      } catch (error) {
        console.error("Error parsing pending registration data:", error);
      }
    }
  }, []);
  
  // Use the appropriate schema based on registration type
  const schema = isGoogleRegistration ? googleRegisterSchema : normalRegisterSchema;
  
  // Initialize form after useState declaration
  const [formState] = useState({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    }
  });
  
  const form = useForm<NormalRegisterFormValues | GoogleRegisterFormValues>({
    resolver: zodResolver(schema as any), // Type cast to fix TypeScript issues
    defaultValues: formState.defaultValues,
  });
  
  useEffect(() => {
    // This needs to be in useEffect to ensure it runs after form is initialized
    const params = new URLSearchParams(window.location.search);
    const isFromGoogle = params.get('source') === 'google';
    
    if (isFromGoogle) {
      setIsGoogleRegistration(true);
    }
    
    const pendingRegData = window?.sessionStorage?.getItem('pendingRegistration');
    if (pendingRegData) {
      try {
        const data = JSON.parse(pendingRegData);
        setPendingData(data);
        
        // Pre-fill the form with the pending data
        if (data.email) {
          form.setValue('email', data.email);
        }
        if (data.displayName) {
          const suggestedUsername = data.displayName.replace(/\s+/g, '') || 
            data.email?.split('@')[0] || '';
          form.setValue('username', suggestedUsername);
        }
      } catch (error) {
        console.error("Error parsing pending registration data:", error);
      }
    }
  }, [form]);

  const onSubmit = async (data: NormalRegisterFormValues | GoogleRegisterFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (isGoogleRegistration && pendingData?.firebaseUid) {
        // For Google registration, we already have Firebase auth, just register with our backend
        const email = pendingData.email || '';
        
        // We need to pass all required parameters
        const username = data.username;
        await register(email, '', username, pendingData.firebaseUid);
        
        // Clear the pending registration data
        sessionStorage.removeItem('pendingRegistration');
        
        toast({
          title: "Registration successful!",
          description: "Your Google account has been linked with Clean Bee.",
        });
        
        navigate("/");
      } else {
        // For normal registration, make sure we have the right type
        const typedData = data as NormalRegisterFormValues;
        
        // We need to try again if the registration process runs into a recoverable error
        // like "auth/email-already-in-use" which gets automatically cleaned up
        let tryCount = 0;
        let success = false;
        
        while (tryCount < 2 && !success) {
          try {
            console.log(`Registration attempt ${tryCount + 1} for ${typedData.email}`);
            await register(typedData.email, typedData.password, typedData.username);
            success = true;
            navigate("/");
          } catch (regError: any) {
            console.log("Registration error:", regError);
            
            // If this error indicates a successful cleanup was performed, try again
            if (regError.cleanupPerformed) {
              console.log("Cleanup was performed, retrying registration");
              tryCount++;
              // Small delay before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              // This is an unrecoverable error, throw it to be caught by outer catch
              throw regError;
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      await loginWithGoogle();
      // The redirect will be handled by Firebase
    } catch (err: any) {
      setError(err.message || "Failed to register with Google. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-primary-500 rounded-full flex items-center justify-center">
            <BeeIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-neutral-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Or{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Sign up with Google
          </Button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-neutral-500">Or continue with</span>
              </div>
            </div>

            {isGoogleRegistration && pendingData && (
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Complete Your Registration</AlertTitle>
                <AlertDescription>
                  Please create a username to complete your registration with Google.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          autoComplete="username"
                          disabled={isLoading}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email" 
                          autoComplete="email"
                          disabled={isLoading || Boolean(isGoogleRegistration && pendingData?.email)}
                          required={!isGoogleRegistration}
                        />
                      </FormControl>
                      <FormMessage />
                      {isGoogleRegistration && pendingData?.email && (
                        <FormDescription>
                          Email from your Google account
                        </FormDescription>
                      )}
                    </FormItem>
                  )}
                />

                {!isGoogleRegistration && (
                  <>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              autoComplete="new-password"
                              disabled={isLoading}
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              autoComplete="new-password"
                              disabled={isLoading}
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : isGoogleRegistration ? 'Complete registration' : 'Create account'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
