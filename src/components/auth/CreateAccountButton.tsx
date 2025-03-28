
import React from "react";
import { UserPlus } from "lucide-react";

interface CreateAccountButtonProps {
  onClick: () => void;
}

const CreateAccountButton: React.FC<CreateAccountButtonProps> = ({ onClick }) => {
  return (
    <div className="text-center mt-6">
      <p className="text-sm text-gray-600">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onClick}
          className="text-primary hover:underline font-medium flex items-center justify-center mx-auto mt-2"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Create an account
        </button>
      </p>
    </div>
  );
};

export default CreateAccountButton;
