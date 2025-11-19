import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Adapter } from "next-auth/adapters";

// Custom adapter wrapper to map 'image' to 'avatar'
const baseAdapter = PrismaAdapter(prisma) as Adapter;
const customAdapter: Adapter = {
  ...baseAdapter,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createUser(user: any) {
    const { image, emailVerified, ...rest } = user;
    const createdUser = await prisma.user.create({
      data: {
        ...rest,
        avatar: image || null,
        emailVerified: emailVerified || null,
      },
    });
    // Map avatar back to image for NextAuth
    return {
      ...createdUser,
      image: createdUser.avatar,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      emailVerified: (createdUser as any).emailVerified,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateUser(user: any) {
    const { image, emailVerified, ...rest } = user;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      ...rest,
      avatar: image !== undefined ? image : undefined,
    };
    if (emailVerified !== undefined) {
      updateData.emailVerified = emailVerified;
    }
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
    // Map avatar back to image for NextAuth
    return {
      ...updatedUser,
      image: updatedUser.avatar,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      emailVerified: (updatedUser as any).emailVerified,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUser(id: any) {
    const user = await baseAdapter.getUser?.(id);
    if (user) {
      return {
        ...user,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        image: (user as any).avatar || (user as any).image,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        emailVerified: (user as any).emailVerified,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    }
    return null;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserByEmail(email: any) {
    const user = await baseAdapter.getUserByEmail?.(email);
    if (user) {
      return {
        ...user,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        image: (user as any).avatar || (user as any).image,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        emailVerified: (user as any).emailVerified,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    }
    return null;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserByAccount(account: any) {
    const user = await baseAdapter.getUserByAccount?.(account);
    if (user) {
      return {
        ...user,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        image: (user as any).avatar || (user as any).image,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        emailVerified: (user as any).emailVerified,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    }
    return null;
  },
};

export const authOptions: NextAuthOptions = {
  adapter: customAdapter,
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production",

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<"email" | "password", string> | undefined) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user || !user.password) {
            return null;
          }

          const passwordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!passwordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    signOut: "/",
  },

  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any; user?: any }) {
      // Initial sign in - save user data
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        // Get image from user object (mapped from avatar by adapter)
        // Also fetch from database to ensure we have the latest avatar
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { avatar: true },
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          token.image = dbUser?.avatar || user.image || (user as any).avatar || null;
        } catch (error) {
          console.error("Error fetching user avatar in JWT callback:", error);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          token.image = user.image || (user as any).avatar || null;
        }
      } else if (token.id) {
        // Refresh user data from database on subsequent requests
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, name: true, email: true, avatar: true },
          });
          if (dbUser) {
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.image = dbUser.avatar;
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
        }
      }

      return token;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
      }
      
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
};
