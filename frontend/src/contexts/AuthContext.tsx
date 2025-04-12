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

  // Check local storage on initial load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("accessToken");
      const storedUserJson = localStorage.getItem("user");
      if (storedToken && storedUserJson) {
        const storedUser = JSON.parse(storedUserJson) as User;
        // Basic validation of stored user object
        if (storedUser && storedUser.id && storedUser.email) {
          setAccessToken(storedToken);
          setUser(storedUser);
        } else {
          // Clear invalid stored data
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
      }
    } catch (error) {
      console.error("Failed to load auth state from storage", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false); // Finished loading initial state
    }
  }, []); // Run only once on mount

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
    try {
      await logoutUser();
    } catch (error) {
      // Log but don't rethrow - we want to proceed with cleanup regardless
      console.error("Context Logout Error:", error);
      // Could add a toast notification here for better UX
    } finally {
      // Always clear state and redirect
      setAccessToken(null);
      setUser(null);
      navigate("/auth");
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
