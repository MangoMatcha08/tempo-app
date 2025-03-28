
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/AuthLayout";
import SignInForm from "@/components/SignInForm";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // If user is authenticated, redirect to dashboard
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
};

export default Index;
