import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { auth } from "@/lib/firebase";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
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
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string()
    .min(6, { message: "Password must be at least 6 characters" }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const [location, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [actionCode, setActionCode] = useState<string | null>(null);
  const [resetComplete, setResetComplete] = useState(false);
  const { toast } = useToast();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Extract and verify the action code from the URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const oobCode = searchParams.get('oobCode');
    
    if (!oobCode) {
      setError("Missing password reset code. Please use the link from your email.");
      setIsVerifying(false);
      return;
    }

    // Verify the action code is valid
    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setActionCode(oobCode);
        setIsVerifying(false);
      })
      .catch((error) => {
        console.error("Error verifying reset code:", error);
        setError("This password reset link is invalid or has expired. Please request a new one.");
        setIsVerifying(false);
      });
  }, []);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!actionCode) {
      setError("Invalid reset code. Please try again.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Confirm the password reset with Firebase
      await confirmPasswordReset(auth, actionCode, data.password);
      
      // Show success state
      setResetComplete(true);
      
      toast({
        title: "Password Reset Complete",
        description: "Your password has been successfully reset. You can now log in with your new password.",
        variant: "default",
      });
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex min-h-screen flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="h-12 w-12 bg-primary-500 rounded-full flex items-center justify-center">
              <BeeIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="mt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto" />
            <h2 className="mt-4 text-center text-lg font-semibold text-neutral-900">
              Verifying your reset link...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-primary-500 rounded-full flex items-center justify-center">
            <BeeIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-neutral-900">
          {resetComplete ? "Password Reset Complete" : "Reset Your Password"}
        </h2>
        {!resetComplete && (
          <p className="mt-2 text-center text-sm text-neutral-600">
            Enter your new password below.
          </p>
        )}
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

          {resetComplete ? (
            <div className="space-y-6">
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your password has been successfully reset. You can now log in with your new password.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col space-y-4">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          autoComplete="new-password"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Password must be at least 6 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          autoComplete="new-password"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Resetting Password...' : 'Reset Password'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => navigate("/login")}
                    type="button"
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;