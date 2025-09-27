"use client";

import DashboardNavbar from "@/components/DashboardNavbar";
import Footer from "@/components/Footer";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const checkAuth = () => {
      const mockAuth = localStorage.getItem("cognito-auth");
      setIsAuthenticated(mockAuth === "true");
    };

    checkAuth();

    if (
      typeof window !== "undefined" &&
      !localStorage.getItem("cognito-auth")
    ) {
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    if (theme === undefined) {
      setTheme("dark");
    }
    console.log("Current theme:", theme);
  }, [theme, setTheme]);

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }
    console.log("Changing password:", passwordData);
    setShowChangePassword(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    alert("Password changed successfully!");
  };

  const handleDeleteAccount = () => {
    console.log("Deleting account...");
    localStorage.removeItem("cognito-auth");
    window.location.href = "/";
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    console.log("Theme changed to:", newTheme);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#E0E0E0] dark:border-[#2A2A2A] p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-2">
              Delete Account
            </h3>
            <p className="text-[#4A4A4A] dark:text-[#B0B0B0] mb-6">
              Are you sure you want to delete your account? This action cannot
              be undone and will permanently remove all your data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium"
              >
                Yes, Delete Account
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-[#E0E0E0] dark:bg-[#2A2A2A] text-[#2A2A2A] dark:text-[#E0E0E0] rounded-md text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
