
import React from "react";

interface TestAccountInfoProps {
  onFillCredentials: () => void;
}

const TestAccountInfo: React.FC<TestAccountInfoProps> = ({ onFillCredentials }) => {
  return (
    <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
      <p className="text-sm text-blue-700 mb-2 font-medium">Test Account:</p>
      <p className="text-xs text-blue-600">Email: test@example.com</p>
      <p className="text-xs text-blue-600">Password: password123</p>
      <button 
        type="button" 
        onClick={onFillCredentials}
        className="text-xs text-blue-700 underline mt-1 hover:text-blue-800"
      >
        Fill test credentials
      </button>
    </div>
  );
};

export default TestAccountInfo;
