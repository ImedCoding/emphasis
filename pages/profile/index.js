// pages/profile/index.js
import { getSession, useSession } from "next-auth/react";
import prisma from "../../lib/prisma";
import Navbar from "../../components/Navbar";
import UserBanner from "../../components/UserBanner";
import CollectionGroup from "../../components/CollectionGroup";
import Footer from "../../components/Footer";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ProfilePage({ user, collections, totalOwned }) {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    let es;
    const connect = () => {
      es = new EventSource(`/api/stream/validations?userId=${session.user.id}`);
      es.onmessage = () =>
        router.replace(router.asPath, undefined, { scroll: false });
      es.onerror = () => {
        es.close();
        setTimeout(connect, 1500); // ⬅️ auto-retry
      };
    };
    connect();
    return () => es?.close();
  }, [session?.user?.id]);

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-6 py-8">
        <UserBanner
          userId={user.id}
          name={user.name}
          avatar={user.avatar}
          bio={user.bio}
          country={user.country}
          count={totalOwned}
        />

        <section className="mt-10 space-y-8">
          <CollectionGroup collections={collections} />
        </section>
      </main>
      <Footer />
    </>
  );
}

export async function getServerSideProps(ctx) {
  const session = await getSession(ctx);
  if (!session) {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }

  // 1) User + toutes les figurines + collections VÉRIFIÉES (pas juste créées)
  const [user, allFigurines, verified] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        country: true,
      },
    }),
    prisma.figurine.findMany(),
    prisma.collection.findMany({
      where: {
        userId: session.user.id,
        verifiedAt: { not: null }, // ✅ clé: seulement les collections vérifiées
      },
      select: {
        figurineId: true,
        proofPhotos: {
          orderBy: { id: "desc" }, // si pas de createdAt, mets { id: 'desc' }
          take: 1,
          select: { urlImage: true },
        },
      },
    }),
  ]);

  // 2) Map figurineId -> dernière photo de preuve (si dispo)
  const proofByFigurineId = new Map(
    verified.map((c) => [c.figurineId, c.proofPhotos[0]?.urlImage || null])
  );

  // 3) Set des figurines owned (uniquement vérifiées)
  const ownedSet = new Set(proofByFigurineId.keys());
  const totalOwned = ownedSet.size;

  // 4) Groupement Collection -> subSeries -> items
  const mapCollections = new Map();

  for (const fig of allFigurines) {
    if (!mapCollections.has(fig.collection)) {
      mapCollections.set(fig.collection, {
        collection: fig.collection,
        subSeriesMap: new Map(),
      });
    }
    const colEntry = mapCollections.get(fig.collection);

    if (!colEntry.subSeriesMap.has(fig.series)) {
      colEntry.subSeriesMap.set(fig.series, {
        series: fig.series,
        items: [],
      });
    }
    const seriesEntry = colEntry.subSeriesMap.get(fig.series);

    // si vérifiée : on montre la photo de preuve, sinon l'image par défaut
    const proofUrl = proofByFigurineId.get(fig.id) || null;

    seriesEntry.items.push({
      id: fig.id,
      name: fig.name,
      imageRef: proofUrl || fig.imageRef, // ✅ remplace l’image si preuve dispo
      owned: ownedSet.has(fig.id), // ✅ true seulement si verifiedAt != null
    });
  }

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
