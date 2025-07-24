import { getSession } from 'next-auth/react';

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false
      }
    };
  }
  // Redirige vers le profil de l'utilisateur connecté
  return {
    redirect: {
      destination: `/profile/${session.user.id}`,
      permanent: false
    }
  };
}

export default function ProfileRedirect() {
  return null;
}