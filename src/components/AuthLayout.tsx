
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-white to-blue-50">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="text-primary font-bold text-4xl mb-2">Tempo</div>
          <div className="text-gray-500 text-sm sm:text-base max-w-sm text-center">
            Maintain the rhythm of your teaching day
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {children}
        </div>

        <p className="text-center text-gray-500 text-xs mt-8">
          © {new Date().getFullYear()} Tempo. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
