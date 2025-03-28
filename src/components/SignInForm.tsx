
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithEmail, signInWithGoogle } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TestAccountInfo from "@/components/auth/TestAccountInfo";
import AuthErrorAlert from "@/components/auth/AuthErrorAlert";
import CreateAccountButton from "@/components/auth/CreateAccountButton";
import { signInSchema, type SignInFormValues } from "@/schemas/auth";
import { getAuthErrorMessage } from "@/utils/auth-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const SignInForm = ({ onCreateAccount }: { onCreateAccount?: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const { firebaseReady, verifyConnection } = useAuth();
  const { toast } = useToast();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignIn = async (data: SignInFormValues) => {
    setIsLoading(true);
    setAuthError(null);
    
    if (!firebaseReady) {
      setIsLoading(false);
      toast({
        title: "Service unavailable",
        description: "Authentication service is temporarily unavailable. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    const { user, error } = await signInWithEmail(data.email, data.password);
    setIsLoading(false);

    if (error) {
      console.error("Sign in failed:", error);
      const errorMessage = getAuthErrorMessage(error);
      setAuthError(errorMessage);
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }
    
    console.log("Sign in successful:", user?.email);
    toast({
      title: "Sign in successful",
      description: "You are now signed in.",
    });
    
    await verifyConnection();
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);
    setIsUnauthorizedDomain(false);
    
    if (!firebaseReady) {
      setIsGoogleLoading(false);
      toast({
        title: "Service unavailable",
        description: "Authentication service is temporarily unavailable. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Initiating Google sign in...");
      const { user, error } = await signInWithGoogle();
      
      if (error) {
        console.error("Google sign in failed:", error);
        const errorMessage = getAuthErrorMessage(error);
        setAuthError(errorMessage);
        
        // Specifically check for unauthorized domain error
        if (error.code === "auth/unauthorized-domain") {
          setIsUnauthorizedDomain(true);
        }
        
        toast({
          title: "Google sign in failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      console.log("Google sign in successful:", user?.email);
      toast({
        title: "Google sign in successful",
        description: "You are now signed in with Google.",
      });
      
      await verifyConnection();
    } catch (err) {
      console.error("Unexpected error during Google sign in:", err);
      setAuthError("An unexpected error occurred. Please try again.");
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const fillTestCredentials = () => {
    form.setValue("email", "test@email.com");
    form.setValue("password", "password123");
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Sign in to Tempo
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Enter your credentials to access your account
        </p>
      </div>

      <AuthErrorAlert 
        error={authError} 
        firebaseReady={firebaseReady} 
      />
      
      {isUnauthorizedDomain && (
        <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertDescription>
            You're accessing this app on a domain not authorized for Google sign-in. 
            Please use email/password login instead, or try from localhost or the production site.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="teacher@school.edu"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-red-500 text-xs mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-red-500 text-xs mt-1">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        
        <TestAccountInfo onFillCredentials={fillTestCredentials} />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !firebaseReady}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="relative flex items-center justify-center mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative bg-white px-4">
          <span className="text-sm text-gray-500">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || !firebaseReady}
        className="w-full mt-4 flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
        {isGoogleLoading ? "Signing in with Google..." : "Sign in with Google"}
      </Button>

      {onCreateAccount && (
        <CreateAccountButton onClick={onCreateAccount} />
      )}
    </div>
  );
};

export default SignInForm;
