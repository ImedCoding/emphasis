// pages/profile/[id].js
import prisma from '../../lib/prisma';
import Navbar from '../../components/Navbar';
import UserBanner from '../../components/UserBanner';
import CollectionGroup from '../../components/CollectionGroup';
import Footer from '../../components/Footer';

export default function PublicProfile({ user, collections, totalOwned }) {
  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-6 py-8">
        <UserBanner
          avatar={user.avatar}
          bio={user.bio}
          country={user.country}
          count={totalOwned}
          canEdit={false}          // ⬅️ lecture seule
        />
        <section className="mt-10 space-y-8">
          <CollectionGroup collections={collections} readonly /> {/* ⬅️ lecture seule */}
        </section>
      </main>
      <Footer />
    </>
  );
}

export async function getServerSideProps({ params }) {
  const userId = params.id;

  const user = await prisma.user.findUnique({
    where: { id: String(userId) },
    select: { id: true, name: true, avatar: true, bio: true, country: true },
  });

  if (!user) return { notFound: true };

  // Figurines + collections vérifiées de CE user
  const [allFigurines, verified] = await Promise.all([
    prisma.figurine.findMany(),
    prisma.collection.findMany({
      where: { userId: String(userId), verifiedAt: { not: null } },
      select: {
        figurineId: true,
        proofPhotos: {
          orderBy: { id: 'desc' },
          take: 1,
          select: { urlImage: true },
        },
      },
    }),
  ]);

  const proofByFigurineId = new Map(
    verified.map((c) => [c.figurineId, c.proofPhotos[0]?.urlImage || null])
  );

  const ownedSet = new Set(proofByFigurineId.keys());
  const totalOwned = ownedSet.size;

  // Groupement par collection → série
  const byCollection = new Map();

  for (const fig of allFigurines) {
    if (!byCollection.has(fig.collection)) {
      byCollection.set(fig.collection, { collection: fig.collection, subSeriesMap: new Map() });
    }
    const col = byCollection.get(fig.collection);

    if (!col.subSeriesMap.has(fig.series)) {
      col.subSeriesMap.set(fig.series, { series: fig.series, items: [] });
    }
    const serie = col.subSeriesMap.get(fig.series);

    const proofUrl = proofByFigurineId.get(fig.id) || null;

    serie.items.push({
      id: fig.id,
      name: fig.name,
      imageRef: proofUrl || fig.imageRef,
      owned: ownedSet.has(fig.id),
    });
  }

  const collections = Array.from(byCollection.values()).map((c) => ({
    collection: c.collection,
    subSeries: Array.from(c.subSeriesMap.values()),
  }));

  return { props: { user, collections, totalOwned } };
}
