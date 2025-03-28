
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { signUpWithEmail } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import AuthErrorAlert from "@/components/auth/AuthErrorAlert";
import FormField from "@/components/auth/FormField";
import SignUpHeader from "@/components/auth/SignUpHeader";
import BackToSignInButton from "@/components/auth/BackToSignInButton";
import { signUpSchema, type SignUpFormValues } from "@/schemas/auth";
import { getAuthErrorMessage } from "@/utils/auth-utils";

const SignUpForm = ({ onBackToSignIn }: { onBackToSignIn: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { firebaseReady, verifyConnection } = useAuth();
  const { toast } = useToast();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSignUp = async (data: SignUpFormValues) => {
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
    
    const { user, error } = await signUpWithEmail(data.email, data.password, data.name);
    setIsLoading(false);

    if (error) {
      console.error("Sign up failed:", error);
      const errorMessage = getAuthErrorMessage(error);
      setAuthError(errorMessage);
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }
    
    console.log("Sign up successful:", user?.email);
    toast({
      title: "Account created",
      description: "Your account has been created successfully.",
    });
    
    await verifyConnection();
  };

  return (
    <div className="w-full">
      <SignUpHeader />

      <AuthErrorAlert 
        error={authError} 
        firebaseReady={firebaseReady} 
      />

      <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
        <FormField 
          id="name"
          label="Full Name"
          type="text"
          placeholder="John Doe"
          register={form.register("name")}
          error={form.formState.errors.name?.message}
        />

        <FormField 
          id="email"
          label="Email"
          type="email"
          placeholder="teacher@school.edu"
          register={form.register("email")}
          error={form.formState.errors.email?.message}
        />

        <FormField 
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          register={form.register("password")}
          error={form.formState.errors.password?.message}
        />

        <FormField 
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          register={form.register("confirmPassword")}
          error={form.formState.errors.confirmPassword?.message}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !firebaseReady}
        >
          {isLoading ? "Creating Account..." : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Account
            </>
          )}
        </Button>
      </form>

      <BackToSignInButton onClick={onBackToSignIn} />
    </div>
  );
};

export default SignUpForm;
