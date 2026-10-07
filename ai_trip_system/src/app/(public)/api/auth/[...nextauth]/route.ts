import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { API_BASE_URL } from "@/config/api";

// Extend NextAuth types to include 'id' and 'accessToken'

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken: string;
  }
  interface User {
    id: string;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accessToken?: string;
  }
}

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          // Call your existing API
          const response = await fetch(
            `${API_BASE_URL}/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                username: credentials.username,
                password: credentials.password,
              }).toString(),
            }
          );

          if (!response.ok) {
            return null;
          }

          const data = await response.json();

          if (data.access_token) {
            // Return user object that will be stored in the JWT
            return {
              id: credentials.username,
              name: credentials.username,
              email: credentials.username,
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
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        if (account.provider === "credentials") {
          token.accessToken = (user as { accessToken?: string }).accessToken;
          token.id = user.id;
        } else if (account.provider === "google") {
          // Handle social login - you'll need to call your API to register/login the user
          try {
            const response = await fetch(
              `${API_BASE_URL}/social-login`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  provider: account.provider,
                  token: account.access_token,
                  name: user.name,
                  email: user.email,
                }),
              }
            );

            if (response.ok) {
              const data = await response.json();
              token.accessToken = data.access_token;
              token.id = user.id;
            }
          } catch (error) {
            console.error("Social login error:", error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { accessToken?: string }).accessToken =
          token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
