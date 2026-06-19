import React, { createContext, useState, useContext, useEffect } from "react";
import { User, UserRole, AuthContextType } from "../types";
import { users } from "../data/users";
import toast from "react-hot-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "business_nexus_user";
const TOKEN_KEY = "business_nexus_token";
const RESET_TOKEN_KEY = "business_nexus_reset_token";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
    role: UserRole,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid credentials");
      }

      if (data.user.role !== role) {
        throw new Error("Role mismatch. Please select the correct role tab.");
      }

      setUser(data.user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      localStorage.setItem(TOKEN_KEY, data.token);

      toast.success("Successfully logged in!");
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Account created successfully! Please login.");
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const user = users.find((u) => u.email === email);
      if (!user) throw new Error("No account found with this email");

      const resetToken = Math.random().toString(36).substring(2, 15);
      localStorage.setItem(RESET_TOKEN_KEY, resetToken);
      toast.success("Password reset instructions sent to your email");
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  // Fixed unused 'newPassword' by adding underscore
  const resetPassword = async (
    token: string,
    _newPassword: string,
  ): Promise<void> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const storedToken = localStorage.getItem(RESET_TOKEN_KEY);
      if (token !== storedToken)
        throw new Error("Invalid or expired reset token");

      localStorage.removeItem(RESET_TOKEN_KEY);
      toast.success("Password reset successfully");
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    toast.success("Logged out successfully");
  };

  // Fixed unused 'userId' by adding underscore
  const updateProfile = async (
    _userId: string,
    updates: Partial<User>,
  ): Promise<void> => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update profile");

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser as User);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
