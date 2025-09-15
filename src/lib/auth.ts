import NextAuth, { DefaultSession } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { MongoClient } from "mongodb";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      email: string;
      name: string;
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    role: string;
    email: string;
    name: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        action: { label: "Action", type: "hidden" }, // 'login' or 'register'
        name: { label: "Name", type: "text" }, // Only for registration
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'fantasy-football-ai');
        const usersCollection = db.collection("users");

        if (credentials.action === "register") {
          // Registration logic
          if (!credentials.name) {
            throw new Error("Name is required for registration");
          }

          // Check if user already exists
          const existingUser = await usersCollection.findOne({
            email: credentials.email,
          });

          if (existingUser) {
            throw new Error("User with this email already exists");
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(credentials.password as string, 12);

          // Create new user
          const newUser = {
            email: credentials.email,
            name: credentials.name,
            password: hashedPassword,
            role: "user", // Default role
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await usersCollection.insertOne(newUser);

          return {
            id: result.insertedId.toString(),
            email: credentials.email,
            name: credentials.name as string,
            role: "user",
          };
        } else {
          // Login logic
          const user = await usersCollection.findOne({
            email: credentials.email,
          });

          if (!user) {
            throw new Error("No user found with this email");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || "user",
          };
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
