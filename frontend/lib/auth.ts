import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
        mode: { label: "Mode", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          const { mode, username, email, password, role } = credentials;

          if (mode === "signin") {
            // Login
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  username_or_email: username || email,
                  password: password,
                }),
              },
            );

            if (!response.ok) {
              const error = await response.json();
              console.log("Full error response:", error);
              console.log("Error keys:", Object.keys(error));

              // Handle different error response formats
              let errorMessage = "Login failed";
              if (error.detail) {
                errorMessage = error.detail;
              } else if (error.message) {
                errorMessage = error.message;
              } else if (typeof error === "string") {
                errorMessage = error;
              }

              console.log("Final error message:", errorMessage);

              // Provide user-friendly error messages
              if (errorMessage.includes("Incorrect username or password")) {
                throw new Error("Incorrect username or password");
              } else if (errorMessage.includes("User not found")) {
                throw new Error("No account found with this username or email");
              } else if (
                errorMessage.includes("Could not validate credentials")
              ) {
                throw new Error(
                  "Invalid credentials. Please check your username and password",
                );
              } else {
                throw new Error(errorMessage);
              }
            }

            const data = await response.json();

            return {
              id: data.user._id,
              name: data.user.username,
              email: data.user.email,
              role: data.user.role,
              accessToken: data.access_token,
            };
          } else if (mode === "signup") {
            // Register
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  username: username,
                  email: email,
                  password: password,
                  role: role,
                }),
              },
            );

            if (!response.ok) {
              const error = await response.json();
              console.log("Full registration error response:", error);
              console.log("Error keys:", Object.keys(error));

              // Handle different error response formats
              let errorMessage = "Registration failed";
              if (error.detail) {
                errorMessage = error.detail;
              } else if (error.message) {
                errorMessage = error.message;
              } else if (typeof error === "string") {
                errorMessage = error;
              }

              console.log("Final registration error message:", errorMessage);

              // Provide user-friendly error messages for registration
              if (errorMessage.includes("Username already exists")) {
                throw new Error(
                  "Username already taken. Please choose a different username",
                );
              } else if (errorMessage.includes("Email already exists")) {
                throw new Error(
                  "An account with this email already exists. Please sign in instead",
                );
              } else if (
                errorMessage.includes("Username already exists") &&
                errorMessage.includes("Email already exists")
              ) {
                throw new Error(
                  "Both username and email are already taken. Please choose different ones",
                );
              } else if (
                errorMessage.includes("Password must be at least 6 characters")
              ) {
                throw new Error("Password must be at least 6 characters long");
              } else if (errorMessage.includes("Invalid email format")) {
                throw new Error("Please enter a valid email address");
              } else if (
                errorMessage.includes("Username must be at least 3 characters")
              ) {
                throw new Error("Username must be at least 3 characters long");
              } else {
                throw new Error(errorMessage);
              }
            }

            const data = await response.json();

            return {
              id: data.user._id,
              name: data.user.username,
              email: data.user.email,
              role: data.user.role,
              accessToken: data.access_token,
            };
          }

          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
        session.user.role = token.role;
        session.user.id = token.id;

        // If we have an access token, fetch fresh user data from backend
        if (token.accessToken) {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`,
              {
                headers: {
                  Authorization: `Bearer ${token.accessToken}`,
                },
              },
            );

            if (response.ok) {
              const userData = await response.json();
              session.user.name = userData.username;
              session.user.email = userData.email;
              session.user.role = userData.role;
            }
          } catch (error) {
            console.error("Failed to fetch fresh user data:", error);
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    signUp: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
