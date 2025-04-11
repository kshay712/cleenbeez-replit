import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
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
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First check if the email exists in our system
      const checkResponse = await fetch(`/api/auth/check-email?email=${encodeURIComponent(data.email)}`);
      const checkResult = await checkResponse.json();
      
      if (!checkResult.exists) {
        // Email doesn't exist in our system
        setError("This email address is not registered. Please check the email address or create a new account.");
        return;
      }
      
      // Email exists, send password reset email via Firebase
      await sendPasswordResetEmail(auth, data.email);
      
      // Show success state
      setEmailSent(true);
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for instructions to reset your password.",
        variant: "default",
      });
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/user-not-found') {
        setError("This email address is not registered. Please check the email address or create a new account.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many password reset attempts. Please try again later.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email format. Please enter a valid email address.");
      } else {
        setError(err.message || "Failed to send password reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
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
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Enter your email address and we'll send you a link to reset your password.
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

          {emailSent ? (
            <div className="space-y-6">
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Email Sent</AlertTitle>
                <AlertDescription className="text-green-700">
                  We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col space-y-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          disabled={isLoading}
                          placeholder="Enter your email address"
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
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPasswordPage;