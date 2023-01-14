import NextAuth, { SessionStrategy } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import {
  checkUserEmailPassword,
  oAuthToDbUser,
} from '../../../database/dbUsers';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Custom Login',
      credentials: {
        email: {
          label: 'Correo',
          type: 'email',
          placeholder: 'correo@gmail.com',
        },
        password: {
          label: 'Contraseña',
          type: 'password',
          placeholder: 'Contraseña',
        },
      },
      async authorize(credentials) {
        return (await checkUserEmailPassword(
          credentials?.email!,
          credentials?.password!
        )) as any;
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // ...add more providers here
  ],

  // custom Pages, cuando entras a las paginas de signIn por defecto te va a redirigier a los que tengas especificados aqui
  pages: {
    signIn: '/authorization/login',
    newUser: '/authorization/register',
  },

  session: {
    maxAge: 2592000, // 30 dias
    strategy: 'jwt' as SessionStrategy,
    updateAge: 86400,
  },

  secret: process.env.NEXTAUTH_SECRET || '',

  // Callbacks
  callbacks: {
    async jwt({ token, account, user }: any) {
      if (account) {
        token.accessToken = account.access_token;
        switch (account.type) {
          case 'credentials':
            token.user = user;
            break;
          case 'oauth':
            token.user = await oAuthToDbUser(user.email, user.name);
            break;
          default:
            break;
        }
      }
      return token;
    },
    async session({ session, token, user }: any) {
      session.accessToken = token.accessToken;
      session.user = token.user;
      return session;
    },
  },
};
export default NextAuth(authOptions);
