import { useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface VerificationBannerProps {
  email?: string | null;
}

export function VerificationBanner({ email }: VerificationBannerProps) {
  const { toast } = useToast();
  const { checkEmailVerificationStatus } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  const handleResendEmail = async () => {
    if (!auth.currentUser) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to verify your email",
      });
      return;
    }
    
    try {
      setIsSending(true);
      await sendEmailVerification(auth.currentUser);
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and click the verification link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: error.message || "Could not send verification email. Please try again later.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      console.log("Manual verification check initiated from banner");
      
      // Even if auth.currentUser is not available, we'll try to force verification
      // by signing in again with the stored credentials to get a fresh auth state
      if (!auth.currentUser && email) {
        console.log("No current Firebase user found, attempting to restore session...");
        
        try {
          // Try to re-establish Firebase session from localStorage if available
          const storedUser = localStorage.getItem('firebase-current-user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            console.log("Found stored Firebase user, refreshing session");
            
            // Call our verification check which will handle the stored user
            const success = await checkEmailVerificationStatus();
            
            if (success) {
              return; // Verification successful, function handled by auth context
            } else {
              console.log("Verification failed using stored credentials");
            }
          }
        } catch (storageError) {
          console.error("Error using stored Firebase credentials:", storageError);
        }
      }
      
      // If we have the current user in Firebase, use that
      if (auth.currentUser) {
        try {
          console.log("Current Firebase user found, checking verification status");
          // Force token refresh
          await auth.currentUser.getIdToken(true);
          
          // Then reload the user
          await auth.currentUser.reload();
          
          console.log("After manual reload - Is verified:", auth.currentUser.emailVerified);
          
          if (auth.currentUser.emailVerified) {
            // Call the context method to update the app state and handle redirects
            const success = await checkEmailVerificationStatus();
            
            if (!success) {
              console.log("Verification state did not update properly");
              toast({
                title: "Verification Detected",
                description: "Your email appears to be verified, but we couldn't update your account. Please refresh the page.",
                variant: "default",
              });
            }
            // Success toast is handled by the auth context method
          } else {
            toast({
              title: "Not Verified Yet",
              description: "Your email is not verified yet. Please check your inbox and click the verification link.",
              variant: "default",
            });
          }
        } catch (reloadError) {
          console.error("Error reloading Firebase user:", reloadError);
          toast({
            variant: "destructive",
            title: "Verification Check Error",
            description: "Error checking verification status. Please refresh the page and try again.",
          });
        }
      } else {
        // No current user, but we still have their email - give helpful guidance
        console.log("No Firebase user available to check verification");
        toast({
          variant: "destructive",
          title: "Authentication Issue",
          description: "Firebase session not active. Please refresh the page or log out and back in to verify your email.",
        });
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      toast({
        variant: "destructive",
        title: "Verification Check Failed",
        description: "Could not check verification status. Please refresh the page and try again.",
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Email Verification Required</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          We've sent a verification email to <strong>{email || 'your email address'}</strong>.
          Please check your inbox and click the verification link.
        </p>
        <p className="text-sm mt-1">
          <strong>Note:</strong> You can only access the home page until your email is verified. 
          Once verified, you'll have full access to all features.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResendEmail}
            disabled={isSending}
          >
            {isSending ? 'Sending...' : 'Resend Verification Email'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCheckVerification}
            disabled={isChecking}
          >
            {isChecking ? 'Checking...' : (
              <>
                <RefreshCw className="mr-1 h-3 w-3" />
                I've Verified My Email
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function VerificationSuccess() {
  return (
    <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertTitle>Email Verified</AlertTitle>
      <AlertDescription>
        Your email has been successfully verified. Thank you!
      </AlertDescription>
    </Alert>
  );
}