import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface VerificationBannerProps {
  email?: string | null;
}

export function VerificationBanner({ email }: VerificationBannerProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  
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
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Email Verification Required</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          We've sent a verification email to <strong>{email || 'your email address'}</strong>.
          Please check your inbox and click the verification link.
        </p>
        <div className="mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResendEmail}
            disabled={isSending}
          >
            {isSending ? 'Sending...' : 'Resend Verification Email'}
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