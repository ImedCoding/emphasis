// pages/api/user/update.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, avatar, bio, country } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId manquant" });
  }

  try {
    // On met à jour le user dans Postgres via Prisma
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar, bio, country },
    });
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
