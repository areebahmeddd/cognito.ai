"use client";

import DashboardNavbar from "@/components/DashboardNavbar";
import Footer from "@/components/Footer";
import { Trash2, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { theme, setTheme } = useTheme();

  const isAuthenticated = !!session;
  const isLoading = status === "loading";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (theme === undefined) {
      setTheme("dark");
    }
  }, [theme, setTheme]);

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please ensure both passwords are identical",
      });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password too short", {
        description: "Password must be at least 6 characters long",
      });
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken || ""}`,
          },
          body: JSON.stringify({
            current_password: passwordData.currentPassword,
            new_password: passwordData.newPassword,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to change password");
      }

      setShowChangePassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password updated successfully", {
        description: "Your password has been changed",
      });
    } catch (error) {
      toast.error("Failed to change password", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken || ""}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete account");
      }

      toast.success("Account deleted successfully", {
        description: "Your account has been permanently deleted",
      });

      // Sign out the user and redirect to home page
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      toast.error("Failed to delete account", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  if (isLoading) {
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
                  <span className="text-[#FF7F50]">Settings</span>
                </h1>
                <p className="mt-2 text-[#4A4A4A] dark:text-[#B0B0B0] font-light">
                  Configure your application preferences
                </p>
              </div>

              <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#E0E0E0] dark:border-[#2A2A2A] p-6">
                <h3 className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-4">
                  General <span className="text-[#FF7F50]">Settings</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                        Dark Mode
                      </label>
                      <p className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0]">
                        Toggle between light and dark themes
                      </p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        theme === "dark" || theme === undefined
                          ? "bg-[#FF7F50]"
                          : "bg-[#E0E0E0] dark:bg-[#2A2A2A]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          theme === "dark" || theme === undefined
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      ></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                        Email Notifications
                      </label>
                      <p className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0]">
                        Receive email updates about your cases
                      </p>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        emailNotifications
                          ? "bg-[#FF7F50]"
                          : "bg-[#E0E0E0] dark:bg-[#2A2A2A]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          emailNotifications ? "translate-x-6" : "translate-x-1"
                        }`}
                      ></span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#E0E0E0] dark:border-[#2A2A2A] p-6">
                <h3 className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-4">
                  Security <span className="text-[#FF7F50]">Settings</span>
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-[#2A2A2A] dark:text-[#E0E0E0] font-medium">
                          Change Password
                        </p>
                        <p className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0]">
                          Update your account password
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setShowChangePassword(!showChangePassword)
                        }
                        className="px-3 py-1.5 bg-[#FF7F50] text-white rounded-md text-sm font-medium whitespace-nowrap w-36"
                      >
                        Change Password
                      </button>
                    </div>

                    {showChangePassword && (
                      <div className="mt-4 p-4 bg-[#F8F8F8] dark:bg-[#2A2A2A] rounded-lg border border-[#E0E0E0] dark:border-[#2A2A2A]">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-1">
                              Current Password
                            </label>
                            <input
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "currentPassword",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-md border border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-[#2A2A2A] dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#FF7F50]"
                              placeholder="Enter current password"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-1">
                              New Password
                            </label>
                            <input
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "newPassword",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-md border border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-[#2A2A2A] dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#FF7F50]"
                              placeholder="Enter new password"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-1">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "confirmPassword",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-md border border-[#E0E0E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] px-3 py-2 text-[#2A2A2A] dark:text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#FF7F50]"
                              placeholder="Confirm new password"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleChangePassword}
                              className="px-4 py-2 bg-[#FF7F50] text-white rounded-md text-sm font-medium"
                            >
                              Update Password
                            </button>
                            <button
                              onClick={() => {
                                setShowChangePassword(false);
                                setPasswordData({
                                  currentPassword: "",
                                  newPassword: "",
                                  confirmPassword: "",
                                });
                              }}
                              className="px-4 py-2 bg-[#E0E0E0] dark:bg-[#2A2A2A] text-[#2A2A2A] dark:text-[#E0E0E0] rounded-md text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#E0E0E0] dark:border-[#2A2A2A] pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-[#2A2A2A] dark:text-[#E0E0E0] font-medium">
                          Two-Factor Authentication (2FA)
                        </p>
                        <p className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0]">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0]">
                          Disabled
                        </span>
                        <button
                          disabled
                          className="px-3 py-1.5 bg-[#E0E0E0] dark:bg-[#2A2A2A] text-[#4A4A4A] dark:text-[#B0B0B0] rounded-md text-sm font-medium whitespace-nowrap w-24 cursor-not-allowed opacity-50"
                        >
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#E0E0E0] dark:border-[#2A2A2A] pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-[#2A2A2A] dark:text-[#E0E0E0] font-medium">
                          Delete Account
                        </p>
                        <p className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0]">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium whitespace-nowrap w-36"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />

          <div className="relative bg-[#FEFEFE] dark:bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[#E0E0E0] dark:border-[#2A2A2A]">
            <button
              aria-label="Close"
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-3 right-3 text-[#666] dark:text-[#999] hover:text-[#FF7F50] transition-colors p-1 rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-start gap-4 mb-6">
              <div className="h-10 w-10 rounded-full bg-[#FFF5F0] dark:bg-[#2A1A0F] flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-[#FF7F50]" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-1">
                  Delete Account
                </h2>
                <p className="text-sm text-[#4A4A4A] dark:text-[#B0B0B0]">
                  Are you sure you want to delete your account? This action
                  cannot be undone and will permanently remove all your data.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="border-[#E0E0E0] dark:border-[#2A2A2A] text-[#4A4A4A] dark:text-[#B0B0B0] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-all duration-300 py-2 px-4 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="bg-[#2A2A2A] text-white hover:bg-[#1A1A1A] dark:bg-[#E0E0E0] dark:text-[#2A2A2A] dark:hover:bg-[#D0D0D0] transition-all duration-300 py-2 px-4 rounded-lg font-medium"
              >
                Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
