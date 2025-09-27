"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Mail, User, X } from "lucide-react";
import { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: { username: string; email: string }) => void;
}

type AuthMode = "signin" | "signup" | "forgot";

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      if (mode === "signin") {
        const users = JSON.parse(localStorage.getItem("cognito-users") || "[]");
        const user = users.find(
          (u: any) =>
            (u.username === formData.username ||
              u.email === formData.username) &&
            u.password === formData.password,
        );

        if (!user) {
          throw new Error("Invalid username or password");
        }

        localStorage.setItem("cognito-auth", "true");
        localStorage.setItem(
          "cognito-current-user",
          JSON.stringify({
            username: user.username,
            email: user.email,
          }),
        );

        onSuccess({ username: user.username, email: user.email });
      } else if (mode === "signup") {
        const users = JSON.parse(localStorage.getItem("cognito-users") || "[]");
        const existingUser = users.find(
          (u: any) =>
            u.username === formData.username || u.email === formData.email,
        );

        if (existingUser) {
          throw new Error("Username or email already exists");
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        // Create new user
        const newUser = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        localStorage.setItem("cognito-users", JSON.stringify(users));

        // Auto sign in after signup
        localStorage.setItem("cognito-auth", "true");
        localStorage.setItem(
          "cognito-current-user",
          JSON.stringify({
            username: newUser.username,
            email: newUser.email,
          }),
        );

        onSuccess({ username: newUser.username, email: newUser.email });
      } else if (mode === "forgot") {
        // Simulate password reset
        throw new Error("Password reset functionality not implemented yet");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setError("");
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#FEFEFE] dark:bg-[#1A1A1A] rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-[#E0E0E0] dark:border-[#2A2A2A]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#666] dark:text-[#999] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-[#2A2A2A] dark:text-[#E0E0E0] mb-2">
            {mode === "signin" && "Welcome back"}
            {mode === "signup" && "Create account"}
            {mode === "forgot" && "Reset password"}
          </h2>
          <p className="text-sm text-[#666] dark:text-[#999] font-light">
            {mode === "signin" && "Sign in to your account to continue"}
            {mode === "signup" && "Join us for a faster forensic analysis"}
            {mode === "forgot" && "Enter your email to reset your password"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username/Email Field */}
          {(mode === "signin" || mode === "signup") && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                {mode === "signin" ? "Username or Email" : "Username"}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666] dark:text-[#999]" />
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  placeholder={
                    mode === "signin"
                      ? "Enter username or email"
                      : "Choose a username"
                  }
                  className="pl-10 border-[#E0E0E0] dark:border-[#2A2A2A] focus:border-[#FF7F50] focus:ring-[#FF7F50]/20"
                  required
                />
              </div>
            </div>
          )}

          {/* Email Field for Signup */}
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666] dark:text-[#999]" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10 border-[#E0E0E0] dark:border-[#2A2A2A] focus:border-[#FF7F50] focus:ring-[#FF7F50]/20"
                  required
                />
              </div>
            </div>
          )}

          {/* Email Field for Forgot Password */}
          {mode === "forgot" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666] dark:text-[#999]" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10 border-[#E0E0E0] dark:border-[#2A2A2A] focus:border-[#FF7F50] focus:ring-[#FF7F50]/20"
                  required
                />
              </div>
            </div>
          )}

          {/* Password Field */}
          {(mode === "signin" || mode === "signup") && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666] dark:text-[#999]" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="Enter your password"
                  className="pl-10 pr-10 border-[#E0E0E0] dark:border-[#2A2A2A] focus:border-[#FF7F50] focus:ring-[#FF7F50]/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666] dark:text-[#999] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password Field for Signup */}
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666] dark:text-[#999]" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  placeholder="Confirm your password"
                  className="pl-10 border-[#E0E0E0] dark:border-[#2A2A2A] focus:border-[#FF7F50] focus:ring-[#FF7F50]/20"
                  required
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2A2A2A] text-white hover:bg-[#1A1A1A] dark:bg-[#E0E0E0] dark:text-[#2A2A2A] dark:hover:bg-[#D0D0D0] transition-all duration-300 py-3 rounded-lg font-medium"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === "signin" && "Signing in..."}
                {mode === "signup" && "Creating account..."}
                {mode === "forgot" && "Sending reset..."}
              </div>
            ) : (
              <>
                {mode === "signin" && "Sign In"}
                {mode === "signup" && "Create Account"}
                {mode === "forgot" && "Send Reset Link"}
              </>
            )}
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-3">
          {mode === "signin" && (
            <>
              <button
                onClick={() => switchMode("forgot")}
                className="text-sm text-[#666] dark:text-[#999] hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors font-light"
              >
                Forgot your password?
              </button>
              <div className="text-sm text-[#666] dark:text-[#999] font-light">
                Don't have an account?{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="text-[#FF7F50] hover:underline font-medium"
                >
                  Sign up
                </button>
              </div>
            </>
          )}

          {mode === "signup" && (
            <div className="text-sm text-[#666] dark:text-[#999] font-light">
              Already have an account?{" "}
              <button
                onClick={() => switchMode("signin")}
                className="text-[#FF7F50] hover:underline font-medium"
              >
                Sign in
              </button>
            </div>
          )}

          {mode === "forgot" && (
            <div className="text-sm text-[#666] dark:text-[#999] font-light">
              Remember your password?{" "}
              <button
                onClick={() => switchMode("signin")}
                className="text-[#FF7F50] hover:underline font-medium"
              >
                Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
