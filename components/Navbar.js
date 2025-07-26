// components/Navbar.js
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <img
            src="/images/logo.png"
            alt="Emphasis Logo"
            className="h-20 cursor-pointer"
          />
        </Link>
        <div className="space-x-4 flex items-center">
          <Link
            href="/community"
            className="text-gray-700 hover:text-indigo-600"
          >
            Communauté
          </Link>
          {session ? (
            <>
              <Link
                href="/profile"
                className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50"
              >
                Mon Profil
              </Link>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Déconnexion
              </button>
            </>
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
  );
}
