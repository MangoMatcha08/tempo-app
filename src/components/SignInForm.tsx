
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithEmail, signInWithGoogle } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus } from "lucide-react";

const signInSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const SignInForm = ({ onCreateAccount }: { onCreateAccount?: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
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
      const errorMessage = getErrorMessage(error);
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
    
    const { user, error } = await signInWithGoogle();
    setIsLoading(false);

    if (error) {
      console.error("Google sign in failed:", error);
      const errorMessage = getErrorMessage(error);
      setAuthError(errorMessage);
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
      description: "You are now signed in.",
    });
    
    await verifyConnection();
  };

  const getErrorMessage = (error: any) => {
    console.log("Processing error:", error.code);
    const errorCode = error.code;
    
    switch (errorCode) {
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password";
      case "auth/email-already-in-use":
        return "Email is already in use";
      case "auth/weak-password":
        return "Password is too weak";
      case "auth/invalid-email":
        return "Invalid email format";
      case "auth/too-many-requests":
        return "Too many attempts, please try again later";
      case "auth/network-request-failed":
        return "Network error, please check your connection";
      default:
        return error.message || "An unknown error occurred";
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

      {!firebaseReady && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Authentication service is temporarily unavailable. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {authError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{authError}</AlertDescription>
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
        
        <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
          <p className="text-sm text-blue-700 mb-2 font-medium">Test Account:</p>
          <p className="text-xs text-blue-600">Email: test@example.com</p>
          <p className="text-xs text-blue-600">Password: password123</p>
          <button 
            type="button" 
            onClick={fillTestCredentials}
            className="text-xs text-blue-700 underline mt-1 hover:text-blue-800"
          >
            Fill test credentials
          </button>
        </div>

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
        disabled={isLoading || !firebaseReady}
        className="w-full mt-4"
      >
        Google
      </Button>

      {onCreateAccount && (
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onCreateAccount}
              className="text-primary hover:underline font-medium flex items-center justify-center mx-auto mt-2"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Create an account
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default SignInForm;
