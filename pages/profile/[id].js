import { getSession } from 'next-auth/react';
import prisma from '../../lib/prisma';

export default function Profile({ user, collections }) {
  return (
    <div className="p-4 container mx-auto">
      <h1 className="text-2xl font-bold">
        Profil de {user.name || user.email}
      </h1>
      <ul className="grid grid-cols-3 gap-4 mt-4">
        {collections.map(c => (
          <li key={c.id} className="p-2 border rounded">
            <img src={c.figurine.imageRef} alt={c.figurine.name} />
            <p className="mt-2">{c.figurine.name}</p>
            <div className="mt-2">
              <img
                src={`/api/qrcode?data=${encodeURIComponent(
                  `https://emphasis.app/verify/${user.id}/${c.figurine.id}`
                )}`}
                alt="QR Code"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function getServerSideProps({ params, req }) {
  const session = await getSession({ req });
  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return { notFound: true };
  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    include: { figurine: true },
  });
  return { props: { user, collections } };
}