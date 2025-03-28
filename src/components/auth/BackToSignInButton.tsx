
import React from "react";

interface BackToSignInButtonProps {
  onClick: () => void;
}

const BackToSignInButton: React.FC<BackToSignInButtonProps> = ({ onClick }) => {
  return (
    <div className="text-center mt-6">
      <p className="text-sm text-gray-600">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onClick}
          className="text-primary hover:underline font-medium"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};

export default BackToSignInButton;
