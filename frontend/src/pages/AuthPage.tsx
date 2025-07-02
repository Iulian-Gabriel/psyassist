// frontend/src/pages/AuthPage.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { LoginCredentials, RegisterFormData } from "../types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Heart, Shield, UserPlus, LogIn } from "lucide-react";

// Define validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dob: z.string().refine((value) => {
    const date = new Date(value);
    return !isNaN(date.getTime()) && date < new Date();
  }, "Invalid date of birth"),
});

export default function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<LoginCredentials | RegisterFormData>({
    resolver: zodResolver(isLoginMode ? loginSchema : registerSchema),
  });

  // Watch form values to check if form has data
  const watchedValues = watch();

  const switchModeHandler = () => {
    // Check if form has any data
    const hasData = Object.values(watchedValues).some(
      (value) => value && value.toString().trim() !== ""
    );

    if (hasData) {
      const confirmed = window.confirm(
        "Switching modes will clear your entered information. Do you want to continue?"
      );
      if (!confirmed) return;
    }

    // Clear form, reset validation, and switch mode
    reset();
    setIsLoginMode((prevMode) => !prevMode);
    setError("");
  };

  const onSubmit = async (data: LoginCredentials | RegisterFormData) => {
    try {
      setLoading(true);
      setError("");

      if (isLoginMode) {
        await login(data as LoginCredentials);
      } else {
        await register(data as RegisterFormData);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "An unexpected error occurred");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>

      {/* Main Content */}
      <div className="relative w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PsyAssist
            </span>
          </h1>
          <p className="text-gray-600">
            {isLoginMode
              ? "Sign in to access your mental wellness journey"
              : "Begin your path to better mental health today"}
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isLoginMode
                    ? "bg-blue-100 text-blue-600"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                {isLoginMode ? (
                  <LogIn className="w-6 h-6" />
                ) : (
                  <UserPlus className="w-6 h-6" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {isLoginMode ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-base">
              {isLoginMode
                ? "Enter your credentials to access your account"
                : "Join thousands on their wellness journey"}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Error Message Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </Label>
                <Input
                  {...registerField("email")}
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  disabled={loading}
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <Input
                  {...registerField("password")}
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete={
                    isLoginMode ? "current-password" : "new-password"
                  }
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Signup Only Fields */}
              {!isLoginMode && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-sm font-medium text-gray-700"
                      >
                        First Name
                      </Label>
                      <Input
                        {...registerField("firstName")}
                        type="text"
                        id="firstName"
                        placeholder="John"
                        disabled={loading}
                        autoComplete="given-name"
                        className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                      {"firstName" in errors && errors.firstName && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-sm font-medium text-gray-700"
                      >
                        Last Name
                      </Label>
                      <Input
                        {...registerField("lastName")}
                        type="text"
                        id="lastName"
                        placeholder="Doe"
                        disabled={loading}
                        autoComplete="family-name"
                        className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                      {"lastName" in errors && errors.lastName && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="dob"
                      className="text-sm font-medium text-gray-700"
                    >
                      Date of Birth
                    </Label>
                    <Input
                      {...registerField("dob")}
                      type="date"
                      id="dob"
                      disabled={loading}
                      autoComplete="bday"
                      max={new Date().toISOString().split("T")[0]}
                      className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                    {"dob" in errors && errors.dob && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.dob.message}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-6">
              <Button
                type="submit"
                className={`w-full h-12 text-base font-medium shadow-lg ${
                  isLoginMode
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                }`}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    {isLoginMode ? (
                      <LogIn className="w-4 h-4 mr-2" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    {isLoginMode ? "Sign In" : "Create Account"}
                  </div>
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={switchModeHandler}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                  disabled={loading}
                >
                  {isLoginMode
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </Button>
              </div>

              {/* Trust indicators */}
              {!isLoginMode && (
                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">
                    By creating an account, you agree to our terms
                  </p>
                  <div className="flex items-center justify-center text-xs text-gray-400">
                    <Shield className="w-3 h-3 mr-1" />
                    Secure & GDPR Compliant
                  </div>
                </div>
              )}
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Need help?{" "}
            <button className="text-blue-600 hover:text-blue-700 underline">
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
