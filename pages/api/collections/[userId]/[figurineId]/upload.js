// pages/api/collections/[userId]/[figurineId]/upload.js
import prisma from '../../../../../lib/prisma';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { sendValidationEvent } from '../../../../../lib/realtime';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const config = { api: { bodyParser: false } };

const useS3 = process.env.STORAGE_PROVIDER === 's3';

function getS3() {
  if (!useS3) return null;
  const accessKeyId     = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const sessionToken    = process.env.AWS_SESSION_TOKEN?.trim();
  const region          = process.env.AWS_REGION?.trim();

  const credentials = sessionToken
    ? { accessKeyId, secretAccessKey, sessionToken }
    : { accessKeyId, secretAccessKey };

  return new S3Client({ region, credentials });
}

function assertImage(file) {
  const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (!okTypes.includes(file.mimetype)) {
    throw new Error('Type de fichier non supporté');
  }
  const max = 8 * 1024 * 1024; // 8MB
  if (file.size > max) {
    throw new Error('Fichier trop volumineux (max 8 Mo)');
  }
}

export default async function handler(req, res) {
  const { userId, figurineId } = req.query;
  if (req.method !== 'POST') return res.status(405).end();

  const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: 'Bad form data' });

    const file = files.photo;
    const tokenField = fields.token;
    const token = Array.isArray(tokenField) ? tokenField[0] : tokenField;

    if (!file)  return res.status(400).json({ error: 'Missing photo' });
    if (!token) return res.status(400).json({ error: 'Missing token' });

    try {
      assertImage(file);

      // 1) Récupère la ligne Collection et vérifie le token
      const whereKey = { userId_figurineId: { userId: String(userId), figurineId: String(figurineId) } };
      const coll = await prisma.collection.findUnique({
        where: whereKey,
        select: { id: true, qrToken: true, verifiedAt: true },
      });
      if (!coll) return res.status(404).json({ error: 'Collection not found' });

      if (coll.verifiedAt) {
        return res.status(409).json({ error: 'Already verified' });
      }
      if (!coll.qrToken || coll.qrToken !== token) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      // 2) Upload fichier (S3 en prod, local en dev)
      let publicUrl = '';
      const ext = path.extname(file.originalFilename || '.jpg').toLowerCase() || '.jpg';

      if (useS3) {
        const s3 = getS3();
        const objectKey = `proofs/${userId}/${figurineId}/${Date.now()}${ext}`;
        const buf = await fs.promises.readFile(file.filepath);

        await s3.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: objectKey,
          Body: buf,
          ContentType: file.mimetype,
          CacheControl: 'public, max-age=31536000, immutable',
        }));

        const base =
          process.env.NEXT_PUBLIC_CDN_BASE ||
          `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
        publicUrl = `${base}/${objectKey}`;
      } else {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const filename = `${userId}-${figurineId}-${Date.now()}${ext}`;
        const dest = path.join(uploadsDir, filename);
        await fs.promises.copyFile(file.filepath, dest);
        publicUrl = `/uploads/${filename}`;
      }

      // 3) Persistance : preuve + validation + invalider le token
      await prisma.photoProof.create({
        data: { urlImage: publicUrl, collection: { connect: { id: coll.id } } },
      });

      await prisma.collection.update({
        where: whereKey,
        data: { verifiedAt: new Date(), qrToken: null }, // ⬅️ token invalidé
      });

      // 4) Push SSE (le profil va se recharger)
      sendValidationEvent(String(userId), {
        figurineId: String(figurineId),
        proofUrl: publicUrl,
      });

      return res.status(200).json({ ok: true, proofUrl: publicUrl });
    } catch (e) {
      console.error('Upload/verify error:', e);
      return res.status(400).json({ error: e.message || 'Upload failed' });
    }
  });
}
