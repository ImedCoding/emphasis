// pages/api/user/update.js
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "../../../lib/prisma";

// (petite validation simple pour éviter le bruit)
const clamp = (s, n) =>
  typeof s === "string" ? s.slice(0, n).trim() : undefined;

export default async function handler(req, res) {
  if (req.method !== "PATCH" && req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1) Récupérer l’utilisateur via la session NextAuth
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  // 2) On n’accepte QUE ces champs
  const { avatar, country, bio } = req.body || {};
  const data = {};

  if (avatar !== undefined) data.avatar = clamp(avatar, 300); // URL/slug
  if (country !== undefined) data.country = clamp(country, 100);
  if (bio !== undefined) data.bio = clamp(bio, 300); // limite courte

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "Aucun champ à mettre à jour" });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, avatar: true, country: true, bio: true },
    });
    return res.status(200).json(updated);
  } catch (err) {
    console.error("update user error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
