import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          if (credentials.role) {
            const registerResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  username: credentials.username,
                  email: credentials.email,
                  password: credentials.password,
                  role: credentials.role,
                }),
              },
            );

            if (!registerResponse.ok) {
              const error = await registerResponse.json();

              if (registerResponse.status === 422 && error.detail) {
                if (Array.isArray(error.detail)) {
                  const fieldErrors = error.detail
                    .map((err: any) => `${err.loc?.join(".")}: ${err.msg}`)
                    .join(", ");
                  throw new Error(fieldErrors);
                } else {
                  throw new Error(error.detail);
                }
              }

              throw new Error(error.detail || "Registration failed");
            }

            const user = await registerResponse.json();

            const loginResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  username_or_email: credentials.username,
                  password: credentials.password,
                }),
              },
            );

            if (!loginResponse.ok) {
              throw new Error("Registration successful but login failed");
            }

            const { access_token } = await loginResponse.json();

            return {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              accessToken: access_token,
            };
          }

          const loginResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                username_or_email: credentials.username,
                password: credentials.password,
              }),
            },
          );

          if (!loginResponse.ok) {
            const error = await loginResponse.json();
            throw new Error(error.detail || "Login failed");
          }

          const { access_token } = await loginResponse.json();

          const userResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            },
          );

          if (!userResponse.ok) {
            throw new Error("Failed to get user info");
          }

          const user = await userResponse.json();
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            accessToken: access_token,
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.accessToken) {
        session.user.id = token.sub!;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;

        try {
          const userResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${token.accessToken}`,
              },
            },
          );

          if (userResponse.ok) {
            const freshUserData = await userResponse.json();
            session.user.username = freshUserData.username;
            session.user.email = freshUserData.email;
            session.user.role = freshUserData.role;
          }
        } catch (error) {}
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
