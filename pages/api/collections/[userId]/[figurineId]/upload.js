import formidable from 'formidable';
import prisma from '../../../../../lib/prisma';
import { uploadToStorage } from '../../../../../lib/storage';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });
    const file = files.file;
    try {
      const url = await uploadToStorage(
        file.filepath,
        file.originalFilename
      );
      const collection = await prisma.collection.findUnique({
        where: {
          userId_figurineId: {
            userId: fields.userId,
            figurineId: fields.figurineId,
          },
        },
      });
      const photo = await prisma.photoProof.create({
        data: { collectionId: collection.id, urlImage: url },
      });
      res.status(200).json(photo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}