// pages/api/collections/[userId]/[figurineId]/index.js
import prisma from '../../../../../lib/prisma';
import QRCode from 'qrcode';

export default async function handler(req, res) {
  const { userId, figurineId } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1) Génère l'URL à encoder dans le QR
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verifyPath = `/verify/${userId}/${figurineId}`;
    const toEncode = `${baseUrl}${verifyPath}`;

    // 2) Crée le Data-URL PNG
    const qrDataUrl = await QRCode.toDataURL(toEncode);

    // 3) Upsert la collection et stocke le QR
    const collection = await prisma.collection.upsert({
      where: {
        userId_figurineId: {
          userId: String(userId),
          figurineId: String(figurineId),
        },
      },
      update: {
        qrCode: qrDataUrl,
      },
      create: {
        user:      { connect: { id: String(userId) } },
        figurine:  { connect: { id: String(figurineId) } },
        qrCode:    qrDataUrl,
      },
    });

    return res.status(200).json(collection);
  } catch (error) {
    console.error('Error in /api/collections/[userId]/[figurineId]:', error);
    return res.status(500).json({ error: 'Cannot add to collection' });
  }
}
