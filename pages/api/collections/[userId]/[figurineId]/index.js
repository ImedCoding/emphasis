import prisma from '../../../../../lib/prisma'
import QRCode from 'qrcode'
import crypto from 'crypto'

export default async function handler(req, res) {
  const { userId, figurineId } = req.query
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const token = crypto.randomBytes(16).toString('hex')   // ⬅️ token aléatoire
    const verifyUrl = `${baseUrl}/verify/${userId}/${figurineId}?t=${token}`

    const qrDataUrl = await QRCode.toDataURL(verifyUrl)

    const collection = await prisma.collection.upsert({
      where: { userId_figurineId: { userId: String(userId), figurineId: String(figurineId) } },
      update: { qrCode: qrDataUrl, qrToken: token }, // ⬅️ stocke le token
      create: {
        user:     { connect: { id: String(userId) } },
        figurine: { connect: { id: String(figurineId) } },
        qrCode:   qrDataUrl,
        qrToken:  token,
      },
    })

    res.status(200).json(collection)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Cannot generate QR code' })
  }
}
