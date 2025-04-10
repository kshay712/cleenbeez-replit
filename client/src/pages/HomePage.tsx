import Hero from "@/components/home/Hero";
import Benefits from "@/components/home/Benefits";
import { useAuth } from "@/hooks/useAuth";
import { VerificationBanner, VerificationSuccess } from "@/components/auth/VerificationBanner";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const HomePage = () => {
  const { user, isAuthenticated, emailVerified, checkEmailVerificationStatus } = useAuth();
  const [showVerifiedSuccess, setShowVerifiedSuccess] = useState(false);
  
  // Check for redirect after verification
  useEffect(() => {
    if (isAuthenticated && emailVerified) {
      // Show success message briefly
      setShowVerifiedSuccess(true);
      
      // Handle redirect if needed
      const redirectPath = sessionStorage.getItem('redirectAfterVerification');
      if (redirectPath && redirectPath !== '/') {
        // Clear the stored path
        sessionStorage.removeItem('redirectAfterVerification');
        // Redirect to the originally requested page after a brief delay
        const timer = setTimeout(() => {
          window.location.href = redirectPath;
        }, 2000);
        
        return () => clearTimeout(timer);
      }
      
      // Hide success message after 5 seconds if no redirect happens
      const timer = setTimeout(() => {
        setShowVerifiedSuccess(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, emailVerified]);
  
  // Poll for verification status when the component mounts
  useEffect(() => {
    if (isAuthenticated && user && !emailVerified) {
      // Check once manually when the component mounts
      const initialCheck = async () => {
        await checkEmailVerificationStatus();
      };
      
      initialCheck();
    }
  }, []);

  return (
    <>
      {/* Show verification banner if user is logged in but not verified */}
      {isAuthenticated && user && !emailVerified && (
        <div className="container mt-6">
          <Alert className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle>Auto-Checking Verification Status</AlertTitle>
            <AlertDescription>
              We'll automatically check if you've verified your email every few seconds.
              Alternatively, you can click the "I've Verified My Email" button below after completing verification.
            </AlertDescription>
          </Alert>
          <VerificationBanner email={user.email} />
        </div>
      )}
      
      {/* Show success message when verification is detected */}
      {isAuthenticated && user && emailVerified && showVerifiedSuccess && (
        <div className="container mt-6">
          <VerificationSuccess />
        </div>
      )}
      
      <Hero />
      <Benefits />
    </>
  );
};

export default HomePage;
