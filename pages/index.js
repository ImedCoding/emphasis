import Link from 'next/link';
import { getSession } from 'next-auth/react';

export default function Home({ session }) {
  return (
    <div className="container mx-auto p-4">
      {session ? (
        <Link href={`/profile/${session.user.id}`}>Voir mon profil</Link>
      ) : (
        <>
          <Link href="/auth/login" className="mr-4">Se connecter</Link>
          <Link href="/auth/register">Créer un compte</Link>
        </>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  return { props: { session } };
}