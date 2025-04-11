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
      
      // Always try our context method first, which has logic to use stored credentials
      // even if there's no active Firebase session
      console.log("Using checkEmailVerificationStatus from context...");
      const verificationSuccess = await checkEmailVerificationStatus();
      
      if (verificationSuccess) {
        console.log("Verification successful through context method");
        return; // Verification successful, all handled by the auth context
      }
      
      // If the context method didn't confirm verification, but we have an active Firebase user
      // we'll try a direct reload as a backup approach
      if (auth.currentUser) {
        try {
          console.log("Context check failed but Firebase user exists, trying direct reload");
          // Force token refresh
          await auth.currentUser.getIdToken(true);
          
          // Then reload the user
          await auth.currentUser.reload();
          
          console.log("After direct reload - Is verified:", auth.currentUser.emailVerified);
          
          if (auth.currentUser.emailVerified) {
            // Try the context method one more time
            const retrySuccess = await checkEmailVerificationStatus();
            
            if (!retrySuccess) {
              console.log("Verification detected but state not updated properly");
              toast({
                title: "Verification Detected",
                description: "Your email appears to be verified. Please refresh the page to update your account status.",
                variant: "default",
              });
            }
          } else {
            toast({
              title: "Not Verified Yet",
              description: "Your email is not verified yet. Please check your inbox and click the verification link.",
              variant: "default",
            });
          }
        } catch (reloadError) {
          console.error("Error during direct Firebase reload:", reloadError);
        }
      } else {
        // No Firebase session, but we might have credentials in localStorage
        const storedCreds = localStorage.getItem('firebase-credentials');
        const storedUser = localStorage.getItem('firebase-current-user');
        
        if ((storedCreds || storedUser) && email) {
          // We have stored credentials but verification still failed
          console.log("Verification failed despite stored credentials");
          toast({
            title: "Verification Status Unknown",
            description: "We couldn't confirm your verification status. Try refreshing the page or logging out and back in.",
            variant: "default",
          });
        } else {
          // No stored credentials at all
          console.log("No Firebase session or stored credentials available");
          toast({
            variant: "destructive",
            title: "Session Expired",
            description: "Your session has expired. Please refresh the page or log out and back in to verify your email.",
          });
        }
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