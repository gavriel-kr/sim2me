import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export type SessionUserType = 'admin' | 'customer';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 }, // 7 days
  pages: {
    signIn: '/admin/login',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.active) return null;

        const valid = await compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          type: 'admin' as SessionUserType,
        };
      },
    }),
    CredentialsProvider({
      id: 'credentials-customer',
      name: 'Customer Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const customer = await prisma.customer.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!customer?.password) return null;

        const valid = await compare(credentials.password, customer.password);
        if (!valid) return null;

        return {
          id: customer.id,
          email: customer.email,
          name: customer.name || '',
          type: 'customer' as SessionUserType,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; email?: string; name?: string; role?: string; type: SessionUserType };
        token.id = u.id;
        token.type = u.type;
        if (u.type === 'admin') token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { type: SessionUserType }).type = (token.type as SessionUserType) || 'admin';
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
};
