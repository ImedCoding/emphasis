// pages/community/index.js
import Link from 'next/link';
import prisma from '../../lib/prisma';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getSession } from 'next-auth/react';

export default function CommunityPage({ users, countries, q, country, min10 }) {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Communauté</h1>

        {/* Filtres */}
        <form method="GET" className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Recherche par nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Recherche (nom)</label>
            <input
              type="text"
              name="q"
              defaultValue={q || ''}
              placeholder="Rechercher un utilisateur…"
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>

          {/* Filtre pays */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Pays</label>
            <select
              name="country"
              defaultValue={country || ''}
              className="mt-1 w-full border rounded px-3 py-2"
            >
              <option value="">Tous les pays</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 10+ vérifiées */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Vérifications</label>
            <label className="inline-flex items-center mt-2">
              <input type="checkbox" name="min10" value="1" defaultChecked={min10} className="mr-2" />
              10&nbsp;+ figurines vérifiées
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded w-full md:w-auto"
            >
              Appliquer
            </button>
            <Link
              href="/community"
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 rounded w-full md:w-auto"
            >
              Réinitialiser
            </Link>
          </div>
        </form>

        {/* Grille utilisateurs */}
        {users.length === 0 ? (
          <p className="text-gray-600">Aucun utilisateur ne correspond à ces critères.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {users.map((u) => (
              <Link
                href={`/profile/${u.id}`}
                key={u.id}
                className="block bg-white rounded-lg shadow hover:shadow-md transition p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={u.avatar || '/images/avatars/default.png'}
                      alt={u.name || 'Avatar'}
                      className="object-cover w-16 h-16"
                      draggable={false}
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{u.name || 'Utilisateur'}</p>
                    <p className="text-sm text-gray-500">{u.country || '—'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {u.verifiedCount} figurine{u.verifiedCount > 1 ? 's' : ''} vérifiée{u.verifiedCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export async function getServerSideProps(ctx) {
  const session = await getSession(ctx);
  const myId = session?.user?.id || null;

  const q = typeof ctx.query.q === 'string' ? ctx.query.q.trim() : '';
  const qLower = q.toLowerCase();
  const country = typeof ctx.query.country === 'string' ? ctx.query.country.trim() : '';
  const min10 = ctx.query.min10 === '1';

  // WHERE de base (sans 'mode')
  const whereUser = {};
  if (country) whereUser.country = country;
  if (myId) whereUser.id = { not: myId }; // exclure mon profil

  // 1) Récupère des users (filtrés par pays et exclusion de soi)
  //    (on ne met PAS la recherche par nom ici)
  const usersRaw = await prisma.user.findMany({
    where: whereUser,
    select: { id: true, name: true, country: true, avatar: true },
    orderBy: { name: 'asc' },
  });

  // 2) Recherche insensible à la casse côté JS
  const usersByName = q
    ? usersRaw.filter((u) => (u.name || '').toLowerCase().includes(qLower))
    : usersRaw;

  // 3) Compter les collections vérifiées pour ces users
  const userIds = usersByName.map((u) => u.id);
  let counts = [];
  if (userIds.length > 0) {
    counts = await prisma.collection.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, verifiedAt: { not: null } },
      _count: { _all: true },
    });
  }
  const countMap = new Map(counts.map((c) => [c.userId, c._count._all]));

  // 4) Appliquer le filtre 10+ si demandé
  let users = usersByName.map((u) => ({
    ...u,
    verifiedCount: countMap.get(u.id) || 0,
  }));
  if (min10) {
    users = users.filter((u) => u.verifiedCount >= 10);
  }

  // 5) Liste des pays pour le sélecteur
  const countryRows = await prisma.user.findMany({
    where: { country: { not: null } },
    distinct: ['country'],
    select: { country: true },
  });
  const countries = countryRows
    .map((r) => r.country)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'fr'));

  return {
    props: {
      users,
      countries,
      q,
      country,
      min10,
    },
  };
}
