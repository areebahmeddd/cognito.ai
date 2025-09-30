"use client";

import DashboardNavbar from "@/components/DashboardNavbar";
import Footer from "@/components/Footer";
import { getUser, setUser } from "@/lib/user";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    role: "",
  });
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    const checkAuth = () => {
      const mockAuth = localStorage.getItem("cognito-auth");
      setIsAuthenticated(mockAuth === "true");

      const user = getUser();
      if (user) {
        const userInfo = {
          fullName: user.name,
          email: user.email,
          role: user.role,
        };
        setUserData(userInfo);
        setFormData(userInfo);
      }
    };

    checkAuth();

    if (
      typeof window !== "undefined" &&
      !localStorage.getItem("cognito-auth")
    ) {
      window.location.href = "/";
    }
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required", {
        description: "Please enter your full name",
      });
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required", {
        description: "Please enter your email address",
      });
      return;
    }
    if (!formData.role.trim()) {
      toast.error("Role is required", {
        description: "Please enter your role",
      });
      return;
    }

    setUser({
      name: formData.fullName,
      email: formData.email,
      role: formData.role,
    });

    setUserData({
      fullName: formData.fullName,
      email: formData.email,
      role: formData.role,
    });

    setIsEditing(false);
    toast.success("Profile updated successfully", {
      description: "Your profile information has been saved",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] dark:bg-[#0F0F0F]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E0E0E0] border-t-[#FF7F50]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0F0F0F]">
      <div className="flex min-h-screen flex-col">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-light tracking-tight text-[#2A2A2A] dark:text-[#E0E0E0]">
                  <span className="text-[#FF7F50]">Profile</span>
                </h1>
                <p className="mt-2 text-[#4A4A4A] dark:text-[#B0B0B0] font-light">
                  Manage your account settings and preferences
                </p>
              </div>

              <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#E0E0E0] dark:border-[#2A2A2A] p-6">
                <div className="flex items-center space-x-6">
                  <div className="h-20 w-20 rounded-full bg-[#FFF5F0] dark:bg-[#2A1A0F] flex items-center justify-center border border-[#FF7F50]/20 dark:border-[#FF7F50]/30">
                    <span className="text-2xl font-medium text-[#FF7F50]">
                      {userData.fullName.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                      {userData.fullName || "User"}
                    </h2>
                    <p className="text-[#4A4A4A] dark:text-[#B0B0B0]">
                      {userData.email || "No email"}
                    </p>
                    <p className="text-sm text-[#FF7F50] font-medium mt-1">
                      {userData.role || "No role"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#E0E0E0] dark:border-[#2A2A2A] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                    Account <span className="text-[#FF7F50]">Information</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="flex items-center gap-2 px-3 py-1 text-sm text-white bg-[#FF7F50] hover:bg-[#E66A3A] rounded-md font-medium transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center gap-2 px-3 py-1 text-sm text-[#4A4A4A] dark:text-[#B0B0B0] font-medium hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-3 py-1 text-sm text-[#4A4A4A] dark:text-[#B0B0B0] font-medium hover:text-[#FF7F50] dark:hover:text-[#FF7F50] transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                      Full Name
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) =>
                          handleInputChange("fullName", e.target.value)
                        }
                        disabled={!isEditing}
                        className={`flex-1 rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF7F50] ${
                          isEditing
                            ? "border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-[#2A2A2A] dark:text-[#E0E0E0]"
                            : "border-[#E0E0E0] dark:border-[#2A2A2A] bg-[#F5F5F5] dark:bg-[#2A2A2A] text-[#8A8A8A] dark:text-[#6A6A6A] cursor-not-allowed"
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                      Email Address
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        disabled={!isEditing}
                        className={`flex-1 rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF7F50] ${
                          isEditing
                            ? "border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-[#2A2A2A] dark:text-[#E0E0E0]"
                            : "border-[#E0E0E0] dark:border-[#2A2A2A] bg-[#F5F5F5] dark:bg-[#2A2A2A] text-[#8A8A8A] dark:text-[#6A6A6A] cursor-not-allowed"
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                      Role
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) =>
                          handleInputChange("role", e.target.value)
                        }
                        disabled={!isEditing}
                        className={`flex-1 rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF7F50] ${
                          isEditing
                            ? "border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-[#2A2A2A] dark:text-[#E0E0E0]"
                            : "border-[#E0E0E0] dark:border-[#2A2A2A] bg-[#F5F5F5] dark:bg-[#2A2A2A] text-[#8A8A8A] dark:text-[#6A6A6A] cursor-not-allowed"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
