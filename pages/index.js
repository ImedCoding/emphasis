import Link from 'next/link';
import { getSession } from 'next-auth/react';
import Footer from '../components/Footer';

export default function Home({ session }) {
  return (
    <>
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            Emphasis
          </Link>
          <div className="space-x-4">
            <Link href="/community" className="text-gray-700 hover:text-indigo-600">
              Communauté
            </Link>
            {session ? (
              <Link
                href={`/profile/${session.user.id}`}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50"
              >
                Mon Profil
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Inscription
                </Link>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50"
                >
                  Connexion
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            Bienvenue sur Emphasis
          </h1>
          <p className="text-lg md:text-xl mb-8">
            La plateforme pour partager et découvrir les figurines Popmart de chacun. 
            Crée ton profil, scanne tes pièces et rejoins notre communauté !
          </p>
          <div className="space-x-4">
            {session ? (
              <Link
                href={`/profile/${session.user.id}`}
                className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow hover:bg-gray-100"
              >
                Voir mon Profil
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow hover:bg-gray-100"
                >
                  Commencer
                </Link>
                <Link
                  href="/auth/login"
                  className="px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600"
                >
                  Connexion
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-6 grid md:grid-cols-3 gap-10 text-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">Profil personnalisé</h3>
            <p>Affiche ta collection, ajoute tes figurines et montre-les à tes amis.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Scanne & Prouve</h3>
            <p>Utilise notre QR-code pour prouver la possession de chacune de tes pièces.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Communauté</h3>
            <p>Découvre et échange avec d’autres collectionneurs du monde entier.</p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  return { props: { session } };
}
