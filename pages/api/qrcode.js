import QRCode from 'qrcode';

export default async function handler(req, res) {
  const { data } = req.query;
  try {
    const dataUrl = await QRCode.toDataURL(data);
    const img = Buffer.from(dataUrl.split(',')[1], 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.send(img);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}