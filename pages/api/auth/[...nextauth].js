import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcrypt';

export default NextAuth({
  // Clé secrète, à définir dans .env.local en production
  secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret',
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Email & Mot de passe',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'email@exemple.com' },
        password: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (user && await bcrypt.compare(credentials.password, user.password)) {
          // Ne renvoie pas le mot de passe
          const { password, ...rest } = user;
          return rest;
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id;
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/register'
  }
});
