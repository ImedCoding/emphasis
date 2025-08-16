// pages/verify/[userId]/[figurineId].js
import { useState } from "react";
import { useRouter } from "next/router";
import prisma from "../../lib/prisma";

export default function Verify({ userId, figurineId, figurine }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const onFileChange = (e) => {
    const img = e.target.files[0];
    if (img) {
      setFile(img);
      setPreview(URL.createObjectURL(img));
      setStep(3);
    }
  };

  const submitProof = async () => {
    setLoading(true);
    const form = new FormData();
    form.append("photo", file);
    try {
      const res = await fetch(
        `/api/collections/${userId}/${figurineId}/upload`,
        { method: "POST", body: form }
      );
      if (!res.ok) throw new Error("Upload failed");
      // une fois ok, redirige vers le profil
      setStep(4); // afficher "Photo enregistrée !"
      router.replace("/profile");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l’upload");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Vérifier « {figurine.name} »</h2>

        {step === 1 && (
          <>
            <p className="mb-6">
              Scannez le QR avec votre téléphone pour arriver ici, puis cliquez
              sur « Commencer » pour prendre la photo.
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full py-2 bg-indigo-600 text-white rounded"
            >
              Commencer
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="mb-4">Prenez une photo de votre figurine :</p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFileChange}
              className="mb-4 w-full"
            />
            <button
              onClick={() => setStep(1)}
              className="mr-2 px-4 py-2 bg-gray-300 rounded"
            >
              Retour
            </button>
          </>
        )}

        {step === 3 && (
          <>
            {preview && (
              <img
                src={preview}
                alt="Aperçu"
                className="mb-4 w-full h-64 object-contain rounded"
              />
            )}
            <button
              onClick={() => setStep(2)}
              className="mr-2 px-4 py-2 bg-gray-300 rounded"
              disabled={loading}
            >
              Reprendre
            </button>
            <button
              onClick={submitProof}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Envoi…" : "Valider la photo"}
            </button>
          </>
        )}

        {step === 4 && (
          <p className="text-green-700 font-semibold">
            Photo enregistrée ! Vous pouvez fermer cette page.
          </p>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const { userId, figurineId } = params;
  const figurine = await prisma.figurine.findUnique({
    where: { id: figurineId },
    select: { name: true },
  });
  if (!figurine) return { notFound: true };
  return { props: { userId, figurineId, figurine } };
}
// This file handles the verification of figurines by users, allowing them to upload proof images.
