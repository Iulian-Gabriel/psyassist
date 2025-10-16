// frontend/src/contexts/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback, // Use useCallback for stable functions
} from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, logoutUser } from "../services/authService";
import {
  LoginCredentials,
  RegisterFormData,
  User,
  AuthResponse,
} from "../types";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Indicates initial auth state loading
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>; // Make logout async if needed elsewhere
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading
  const navigate = useNavigate(); // Use navigate for redirects

  // Optional: Add a function to check token expiration
  const isTokenExpired = useCallback((token: string): boolean => {
    if (!token) return true;

    try {
      // Extract the payload from JWT token
      const payload = JSON.parse(atob(token.split(".")[1]));
      // Check if token has expired
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      console.error("Error checking token expiration:", e);
      return true;
    }
  }, []);

  // Check local storage on initial load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("accessToken");
      const storedUserJson = localStorage.getItem("user");

      if (storedToken && storedUserJson) {
        const storedUser = JSON.parse(storedUserJson) as User;

        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          console.log("Stored token is expired, attempting to refresh...");
          // Let the API interceptor handle refresh on next request
          // Just clear the current token so we start with a clean state
          localStorage.removeItem("accessToken");
        } else {
          // Token is valid, use it
          setAccessToken(storedToken);
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.error("Failed to load auth state from storage", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  }, [isTokenExpired]);

  // You can optionally use this in your component for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const checkTokenInterval = setInterval(() => {
        const token = localStorage.getItem("accessToken");
        if (token && isTokenExpired(token)) {
          console.log(
            "Token has expired, waiting for next API call to refresh"
          );
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(checkTokenInterval);
    }
  }, [isTokenExpired]);

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        const data: AuthResponse = await loginUser(credentials);
        setAccessToken(data.accessToken);
        setUser(data.user);
        navigate("/dashboard"); // Redirect on success
      } catch (error: unknown) {
        console.error("Context Login Error:", error);
        // Rethrow the error so the component can display it
        throw error;
      }
    },
    [navigate]
  ); // Dependency: navigate

  const handleRegister = useCallback(
    async (userData: RegisterFormData) => {
      try {
        const data: AuthResponse = await registerUser(userData);
        setAccessToken(data.accessToken);
        setUser(data.user);
        // Decide where to redirect after registration
        // Option 1: Dashboard (since backend logs them in)
        navigate("/dashboard");
        // Option 2: Login page (if you want them to explicitly log in)
        // navigate('/auth');
        // alert('Registration successful! Please log in.');
      } catch (error: unknown) {
        console.error("Context Register Error:", error);
        throw error; // Rethrow for component
      }
    },
    [navigate]
  ); // Dependency: navigate

  const handleLogout = useCallback(async () => {
    // First, clear state and localStorage immediately
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    // Navigate before making the API call
    navigate("/auth", { replace: true });

    // Then make the API call to cleanup server-side
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout API Error:", error);
      // Don't rethrow - we've already cleared client state
    }
  }, [navigate]); // Dependency: navigate

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!accessToken && !!user,
        isLoading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
