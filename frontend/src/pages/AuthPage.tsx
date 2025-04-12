// frontend/src/pages/AuthPage.tsx
import React, { useState } from "react";
// No need for useNavigate here, context handles redirection
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
import { LoginCredentials, RegisterFormData } from "../types"; // Import types
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
  const [error, setError] = useState<string>(""); // Component-level error message
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");

  const { login, register } = useAuth(); // Get functions from context

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials | RegisterFormData>({
    resolver: zodResolver(isLoginMode ? loginSchema : registerSchema),
  });

  const switchModeHandler = () => {
    // Check if form has data
    const hasData =
      email || password || (!isLoginMode && (firstName || lastName || dob));

    if (hasData) {
      // Show confirmation dialog
      const confirmed = window.confirm(
        "Switching modes will clear your entered information. Do you want to continue?"
      );
      if (!confirmed) return;
    }

    // Clear form and switch mode
    setIsLoginMode((prevMode) => !prevMode);
    setError("");
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setDob("");
  };

  const onSubmit = async (data: LoginCredentials | RegisterFormData) => {
    setError("");
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(data);
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
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-[380px]">
        <CardHeader>
          <CardTitle>{isLoginMode ? "Login" : "Sign Up"}</CardTitle>
          <CardDescription>
            {isLoginMode
              ? "Enter your credentials to access your account."
              : "Create an account to get started."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Error Message Display */}
            {error && (
              <p className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-md">
                {error}
              </p>
            )}

            {/* Email Field */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                {...registerField("email")}
                type="email"
                id="email"
                placeholder="you@example.com"
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            {/* Password Field */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                {...registerField("password")}
                type="password"
                id="password"
                placeholder="••••••••"
                disabled={loading}
                autoComplete={isLoginMode ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
            {/* Signup Only Fields */}
            {!isLoginMode && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* First/Last name side-by-side */}
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      {...registerField("firstName")}
                      type="text"
                      id="firstName"
                      placeholder="John"
                      disabled={loading}
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    {"firstName" in errors && errors.firstName && (
                      <p className="text-xs text-red-500">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      {...registerField("lastName")}
                      type="text"
                      id="lastName"
                      placeholder="Doe"
                      disabled={loading}
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                    {!isLoginMode &&
                      "lastName" in errors &&
                      errors.lastName && (
                        <p className="text-xs text-red-500">
                          {errors.lastName.message}
                        </p>
                      )}
                  </div>
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    {...registerField("dob")}
                    type="date"
                    id="dob" // Uses browser's date picker
                    disabled={loading}
                    autoComplete="bday"
                    max={new Date().toISOString().split("T")[0]} // Prevent future dates
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                  {!isLoginMode && "dob" in errors && errors.dob && (
                    <p className="text-xs text-red-500">{errors.dob.message}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pt-4">
            {/* Added padding top */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Processing..."
                : isLoginMode
                ? "Login"
                : "Create Account"}
            </Button>
            <Button
              type="button" // Important: prevents form submission
              variant="link"
              onClick={switchModeHandler}
              className="w-full text-sm" // Make link smaller
              disabled={loading}
            >
              {isLoginMode
                ? "Need an account? Sign Up"
                : "Already have an account? Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
