import React, { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { Mail, Lock, X, Sparkles, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          // Automatic login or notice
          alert("Sign up successful! Please check your email for verification link if configured.");
          onSuccess();
          onClose();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate Google sign in.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background gradient accents */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              {isSignUp ? "Create Workspace Account" : "Welcome Back"}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-gray-950 hover:bg-gray-800 border border-gray-850 text-gray-400 hover:text-white transition duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/45 border border-red-500/20 text-red-300 text-xs rounded-xl font-mono">
            {errorMsg}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-950 border border-gray-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition duration-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-950 border border-gray-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99] transition duration-250 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSignUp ? (
              "Sign Up"
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <div className="relative my-6 text-center z-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800" />
          </div>
          <span className="relative bg-gray-900 px-3 text-[10px] font-mono text-gray-500 uppercase">Or Continue With</span>
        </div>

        {/* Social Authentication */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-4 rounded-xl bg-gray-950 border border-gray-850 hover:bg-gray-800 text-gray-200 text-sm hover:text-white transition duration-200 flex items-center justify-center gap-2.5 cursor-pointer relative z-10"
        >
          <svg className="h-4 w-4 text-gray-300 fill-current" viewBox="0 0 24 24">
            <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.415 0-6.182-2.766-6.182-6.18 0-3.416 2.767-6.183 6.182-6.183 1.574 0 2.997.59 4.09 1.554l3.125-3.125C19.3 2.14 16.03 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-11 0-.646-.07-1.285-.203-1.895H12.24z"/>
          </svg>
          <span>Google Account</span>
        </button>

        {/* Switch tab buttons */}
        <div className="mt-6 text-center text-xs text-gray-400 relative z-10">
          {isSignUp ? (
            <p>
              Already have an account?{" "}
              <button 
                onClick={() => setIsSignUp(false)}
                className="text-emerald-400 font-semibold hover:underline bg-transparent border-none cursor-pointer focus:outline-none"
              >
                Log In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account yet?{" "}
              <button 
                onClick={() => setIsSignUp(true)}
                className="text-emerald-400 font-semibold hover:underline bg-transparent border-none cursor-pointer focus:outline-none"
              >
                Sign Up
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
