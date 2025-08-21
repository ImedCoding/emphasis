// pages/api/debug/s3.js
import { S3Client, HeadBucketCommand, GetBucketLocationCommand } from '@aws-sdk/client-s3';

export default async function handler(req, res) {
  const accessKeyId     = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const sessionToken    = process.env.AWS_SESSION_TOKEN?.trim();
  const region          = process.env.AWS_REGION?.trim();
  const bucket          = process.env.S3_BUCKET?.trim();

  const creds = sessionToken
    ? { accessKeyId, secretAccessKey, sessionToken }
    : { accessKeyId, secretAccessKey };

  const s3 = new S3Client({ region, credentials: creds });

  const out = {
    envLoaded: {
      region, bucket,
      keyIdPrefix: accessKeyId ? accessKeyId.slice(0, 4) : null,
      secretPresent: !!secretAccessKey,
      sessionTokenPresent: !!sessionToken,
    },
    getBucketLocation: null,
    headBucket: null,
    errors: {},
  };

  try {
    const loc = await s3.send(new GetBucketLocationCommand({ Bucket: bucket }));
    out.getBucketLocation = loc?.LocationConstraint ?? 'us-east-1/null';
  } catch (e) {
    out.errors.getBucketLocation = { name: e.name, message: String(e) };
  }

  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    out.headBucket = 'ok';
  } catch (e) {
    out.errors.headBucket = {
      name: e.name, message: String(e),
      expectRegion: e?.$metadata?.httpHeaders?.['x-amz-bucket-region'] || null,
    };
  }

  res.status(200).json(out);
}
