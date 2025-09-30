export interface User {
  name: string;
  email: string;
  role: string;
}

export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;

  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

export const setUser = (user: User): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch (error) {
    console.error("Error saving user data:", error);
  }
};

export const clearUser = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("user");
  localStorage.removeItem("cognito-auth");
  localStorage.removeItem("cognito-current-user");
};

export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;

  return localStorage.getItem("cognito-auth") === "true";
};
