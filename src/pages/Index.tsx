
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/AuthLayout";
import SignInForm from "@/components/SignInForm";
import SignUpForm from "@/components/SignUpForm";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    // This effect will run when the component mounts and when user or loading state changes
    if (!loading && user) {
      // If user is authenticated, redirect to dashboard
      console.log("User is authenticated, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const toggleForm = () => {
    setShowSignUp(!showSignUp);
  };

  // Don't render anything until the auth state is determined
  if (loading) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {showSignUp ? (
        <SignUpForm onBackToSignIn={() => setShowSignUp(false)} />
      ) : (
        <SignInForm onCreateAccount={() => setShowSignUp(true)} />
      )}
    </AuthLayout>
  );
};

export default Index;
