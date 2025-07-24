import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcrypt';

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Email & Mot de passe',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (user && await bcrypt.compare(credentials.password, user.password)) {
          // Masquer le mot de passe
          const { password, ...rest } = user;
          return rest;
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/register'
  },
  secret: process.env.NEXTAUTH_SECRET,
});