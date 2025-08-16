// pages/api/collections/[userId]/[figurineId]/upload.js
import prisma from '../../../../../lib/prisma';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { sendValidationEvent } from '../../../../../lib/realtime';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const { userId, figurineId } = req.query;
  if (req.method !== 'POST') return res.status(405).end();

  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: 'Bad form data' });

    const file = files.photo;
    if (!file) return res.status(400).json({ error: 'Missing photo' });

    try {
      // 1) Enregistrer l'image côté serveur (MVP : public/uploads)
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const ext = path.extname(file.originalFilename || '.jpg');
      const filename = `${userId}-${figurineId}-${Date.now()}${ext}`;
      const dest = path.join(uploadsDir, filename);
      await fs.promises.copyFile(file.filepath, dest);
      const publicUrl = `/uploads/${filename}`;

      // 2) Créer la preuve + marquer la collection vérifiée
      //    (assure-toi d'avoir verifiedAt DateTime? dans Collection)
      const collKey = { userId_figurineId: { userId: String(userId), figurineId: String(figurineId) } };

      // sécurité: s'assurer que la ligne Collection existe déjà (créée lors du clic "Je l'ai")
      const coll = await prisma.collection.findUnique({ where: collKey });
      if (!coll) return res.status(404).json({ error: 'Collection not found' });

      await prisma.photoProof.create({
        data: {
          urlImage: publicUrl,
          collection: { connect: collKey },
        },
      });

      await prisma.collection.update({
        where: collKey,
        data: { verifiedAt: new Date() },
      });

      // 3) Notifier via SSE tous les clients du user
      sendValidationEvent(String(userId), {
        figurineId: String(figurineId),
        proofUrl: publicUrl,
      });

      res.status(200).json({ ok: true, proofUrl: publicUrl });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
}
