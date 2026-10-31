// src/components/log/Log.tsx
import { useState } from "react";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

const Log = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="w-full max-w-md mx-auto">
      {mode === 'login' && (
        <SignInForm setIsSingUp={() => setMode("register")} />
      )}
      {mode === 'register' && (
        <SignUpForm setIsLogin={() => setMode("login")} />
      )}
    </div>
  );
};

export default Log;