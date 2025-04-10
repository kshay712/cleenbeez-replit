import Hero from "@/components/home/Hero";
import Benefits from "@/components/home/Benefits";
import { useAuth } from "@/hooks/useAuth";
import { VerificationBanner } from "@/components/auth/VerificationBanner";
import { useEffect } from "react";

const HomePage = () => {
  const { user, isAuthenticated, emailVerified } = useAuth();
  
  // Check for redirect after verification
  useEffect(() => {
    if (isAuthenticated && emailVerified) {
      const redirectPath = sessionStorage.getItem('redirectAfterVerification');
      if (redirectPath && redirectPath !== '/') {
        // Clear the stored path
        sessionStorage.removeItem('redirectAfterVerification');
        // Redirect to the originally requested page
        window.location.href = redirectPath;
      }
    }
  }, [isAuthenticated, emailVerified]);

  return (
    <>
      {/* Show verification banner if user is logged in but not verified */}
      {isAuthenticated && user && !emailVerified && (
        <div className="container mt-6">
          <VerificationBanner email={user.email} />
        </div>
      )}
      <Hero />
      <Benefits />
    </>
  );
};

export default HomePage;
