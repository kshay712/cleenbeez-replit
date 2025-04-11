import Hero from "@/components/home/Hero";
import Benefits from "@/components/home/Benefits";
import { useAuth } from "@/hooks/useAuth";
import { VerificationBanner, VerificationSuccess } from "@/components/auth/VerificationBanner";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const HomePage = () => {
  const { user, isAuthenticated, emailVerified, checkEmailVerificationStatus, isNewRegistration } = useAuth();
  const [showVerifiedSuccess, setShowVerifiedSuccess] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);
  
  // Check for redirect after verification and handle banner visibility
  useEffect(() => {
    if (isAuthenticated && user) {
      if (emailVerified) {
        // If email is verified, hide the verification banner immediately
        setShowVerificationBanner(false);
        
        // Show success message briefly (only for new registrations)
        if (isNewRegistration) {
          setShowVerifiedSuccess(true);
          
          // Hide success message after 5 seconds
          const successTimer = setTimeout(() => {
            setShowVerifiedSuccess(false);
          }, 5000);
          
          return () => clearTimeout(successTimer);
        }
        
        // Handle redirect if needed
        const redirectPath = sessionStorage.getItem('redirectAfterVerification');
        if (redirectPath && redirectPath !== '/') {
          // Clear the stored path
          sessionStorage.removeItem('redirectAfterVerification');
          // Redirect to the originally requested page after a brief delay
          const redirectTimer = setTimeout(() => {
            window.location.href = redirectPath;
          }, 2000);
          
          return () => clearTimeout(redirectTimer);
        }
      } else {
        // If email is not verified, show the verification banner
        setShowVerificationBanner(true);
      }
    }
  }, [isAuthenticated, emailVerified, user, isNewRegistration]);
  
  // Set up polling for verification status
  useEffect(() => {
    let verificationTimer: NodeJS.Timeout | null = null;
    
    if (isAuthenticated && user && !emailVerified) {
      // Check immediately when the component mounts
      const initialCheck = async () => {
        await checkEmailVerificationStatus();
      };
      
      initialCheck();
      
      // Set up polling every 10 seconds to check for verification
      verificationTimer = setInterval(async () => {
        console.log("Polling for email verification status...");
        await checkEmailVerificationStatus();
      }, 10000); // Check every 10 seconds
    }
    
    // Clean up timer on unmount
    return () => {
      if (verificationTimer) {
        clearInterval(verificationTimer);
      }
    };
  }, [isAuthenticated, user, emailVerified, checkEmailVerificationStatus]);

  return (
    <>
      {/* Show verification banner if user is logged in but not verified */}
      {isAuthenticated && user && !emailVerified && showVerificationBanner && (
        <div className="container mt-6">
          <VerificationBanner email={user.email} />
        </div>
      )}
      
      {/* Show success message when verification is detected */}
      {isAuthenticated && user && emailVerified && showVerifiedSuccess && (
        <div className="container mt-6">
          <VerificationSuccess forceShow={true} />
        </div>
      )}
      
      <Hero />
      <Benefits />
    </>
  );
};

export default HomePage;
