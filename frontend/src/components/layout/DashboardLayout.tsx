import React, { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Global socket connection + popup listener.
  useEffect(() => {
    if (!user) return;

    const socketUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace("/api", "")
      : "http://localhost:5000";

    const socket = io(socketUrl);

    socket.on("connect", () => {
      socket.emit("register-user", user.id);
    });

    // Global popup trigger — works no matter which page the user is on
    socket.on("new-notification", (data: any) => {
      toast.success(data?.message || "New notification received", {
        duration: 5000,
        position: "top-right",
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" />
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
