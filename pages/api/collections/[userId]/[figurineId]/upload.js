import prisma from "../../../../../lib/prisma";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { sendValidationEvent } from "../../../../../lib/realtime";
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

export const config = { api: { bodyParser: false } };

const useS3 = process.env.STORAGE_PROVIDER === "s3";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
const region = process.env.AWS_REGION?.trim();

const s3 = useS3
  ? new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    })
  : null;

function assertImage(file) {
  const okTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];
  if (!okTypes.includes(file.mimetype)) {
    throw new Error("Type de fichier non supporté");
  }
  const max = 8 * 1024 * 1024; // 8 MB
  if (file.size > max) {
    throw new Error("Fichier trop volumineux");
  }
}

export default async function handler(req, res) {
  const { userId, figurineId } = req.query;
  if (req.method !== "POST") return res.status(405).end();

  const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: "Bad form data" });

    const file = files.photo;
    if (!file) return res.status(400).json({ error: "Missing photo" });

    try {
      assertImage(file);

      // Vérifier l’existence de la ligne Collection
      const keyWhere = {
        userId_figurineId: {
          userId: String(userId),
          figurineId: String(figurineId),
        },
      };
      const coll = await prisma.collection.findUnique({ where: keyWhere });
      if (!coll) return res.status(404).json({ error: "Collection not found" });

      let publicUrl;

      if (useS3) {
        // --- Upload S3 ---
        const ext =
          path.extname(file.originalFilename || ".jpg").toLowerCase() || ".jpg";
        const objectKey = `proofs/${userId}/${figurineId}/${Date.now()}${ext}`;

        const buf = await fs.promises.readFile(file.filepath);

        try {
          await s3.send(
            new HeadBucketCommand({ Bucket: process.env.S3_BUCKET })
          );
        } catch (err) {
          console.error("HeadBucket failed:", err);
          const expectRegion =
            err?.$metadata?.httpHeaders?.["x-amz-bucket-region"];
          if (expectRegion && expectRegion !== region) {
            console.error(
              `❌ Mauvaise région. Bucket en: ${expectRegion}, config: ${region}`
            );
          }
          return res.status(500).json({ error: "S3 config error" });
        }

        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: objectKey,
            Body: buf,
            ContentType: file.mimetype,
            CacheControl: "public, max-age=31536000, immutable",
          })
        );

        const base =
          process.env.NEXT_PUBLIC_CDN_BASE ||
          `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
        publicUrl = `${base}/${objectKey}`;
        
      } else {
        // --- Upload local (dev) ---
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir))
          fs.mkdirSync(uploadsDir, { recursive: true });
        const ext =
          path.extname(file.originalFilename || ".jpg").toLowerCase() || ".jpg";
        const filename = `${userId}-${figurineId}-${Date.now()}${ext}`;
        const dest = path.join(uploadsDir, filename);
        await fs.promises.copyFile(file.filepath, dest);
        publicUrl = `/uploads/${filename}`;
      }

      // Persistance
      await prisma.photoProof.create({
        data: { urlImage: publicUrl, collection: { connect: keyWhere } },
      });

      await prisma.collection.update({
        where: keyWhere,
        data: { verifiedAt: new Date() },
      });

      // Push SSE
      sendValidationEvent(String(userId), {
        figurineId: String(figurineId),
        proofUrl: publicUrl,
      });

      res.status(200).json({ ok: true, proofUrl: publicUrl });
    } catch (e) {
      console.error(e);
      res.status(400).json({ error: e.message || "Upload failed" });
    }
  });
}
