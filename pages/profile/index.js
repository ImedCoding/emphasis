// pages/profile/index.js
import { getSession } from 'next-auth/react';
import prisma from '../../lib/prisma';
import Navbar from '../../components/Navbar';
import UserBanner from '../../components/UserBanner';
import CollectionGroup from '../../components/CollectionGroup';
import Footer from '../../components/Footer';

export default function ProfilePage({ user, collections, totalOwned }) {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-6 py-8">
        <UserBanner
          userId={user.id}
          avatar={user.avatar}
          bio={user.bio}
          country={user.country}
          count={totalOwned}
        />

        <section className="mt-10 space-y-8">
           <CollectionGroup
              collections={collections}
            />
        </section>
      </main>
      <Footer />
    </>
  );
}

export async function getServerSideProps(ctx) {
  const session = await getSession(ctx);
  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  // Récupère l'utilisateur et ses collections
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      country: true,
    },
  });

    // Récupère toutes les figurines et celles possédées
  const [allFigurines, owned] = await Promise.all([
    prisma.figurine.findMany(),
    prisma.collection.findMany({
      where: { userId: session.user.id },
      select: { figurineId: true },
    }),
  ]);

  const ownedSet = new Set(owned.map((o) => o.figurineId));
  const totalOwned = ownedSet.size;

  // Regroupe d'abord par collection puis par sous-série
  const mapCollections = new Map();

  for (const fig of allFigurines) {
    // 1) Collection
    if (!mapCollections.has(fig.collection)) {
      mapCollections.set(fig.collection, {
        collection: fig.collection,
        subSeriesMap: new Map(),  // temporaire
      });
    }
    const colEntry = mapCollections.get(fig.collection);

    // 2) Sous-série
    if (!colEntry.subSeriesMap.has(fig.series)) {
      colEntry.subSeriesMap.set(fig.series, {
        series: fig.series,
        items: [],
      });
    }
    const seriesEntry = colEntry.subSeriesMap.get(fig.series);

    // 3) Ajouter l'item
    seriesEntry.items.push({
      id: fig.id,
      name: fig.name,
      imageRef: fig.imageRef,
      owned: ownedSet.has(fig.id),
    });
  }

  // Convertit en tableau au format voulu
  const collections = Array.from(mapCollections.values()).map((col) => ({
    collection: col.collection,
    subSeries: Array.from(col.subSeriesMap.values()),
  }));

  return {
    props: {
      user,
      collections,
      totalOwned,
    },
  };
}
