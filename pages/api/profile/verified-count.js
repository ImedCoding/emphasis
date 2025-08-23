// pages/api/profile/verified-count.js
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'unauthorized' });

  const count = await prisma.collection.count({
    where: { userId: session.user.id, verifiedAt: { not: null } },
  });
  res.status(200).json({ count });
}
