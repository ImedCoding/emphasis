import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function uploadToStorage(path, filename) {
  const fileStream = fs.createReadStream(path);
  const key = `proofs/${Date.now()}_${filename}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: fileStream,
    })
  );
  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
}