// Fichier : components/CollectionGroupNested.js
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";

/**
 * Affiche les figurines regroupées par collection puis par sous-série.
 * Props:
 *  - collections: Array<{
 *       collection: string,
 *       subSeries: Array<{
 *         series: string,
 *         items: Array<{ id: string, name: string, imageRef: string, owned: boolean }>
 *       }>
 *     }>
 */
export default function CollectionGroup({ collections }) {
  const { data: session } = useSession();
  const router = useRouter();

  // État pour stocker les QR générés, par id de figurine
  const [qrMap, setQrMap] = useState({});

  const handleAdd = async (figurineId) => {
    if (!session) {
      return alert("Veuillez vous connecter.");
    }

    try {
      // 1) Création / upsert + génération QR
      const res = await fetch(
        `/api/collections/${session.user.id}/${figurineId}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la requête");

      // 2) Mémorisation du QR
      setQrMap((prev) => ({
        ...prev,
        [figurineId]: data.qrCode,
      }));
    } catch (err) {
      console.error(err);
      alert("Impossible de générer le QR code.");
    }
  };

  return (
    <div className="space-y-8">
      {collections.map((col) => (
        <div key={col.collection} className="bg-white rounded-lg shadow">
          {/* En-tête de la collection */}
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">{col.collection}</h2>
          </div>
          <div className="p-6 space-y-4">
            {col.subSeries.map((sub) => (
              <SubSeriesGroup
                key={sub.series}
                sub={sub}
                handleAdd={handleAdd}
                qrMap={qrMap}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SubSeriesGroup({ sub, handleAdd, qrMap }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 py-2 bg-gray-100 rounded-md"
      >
        <span className="font-semibold">{sub.series}</span>
        <span className="text-lg">{open ? "–" : "+"}</span>
      </button>

      {open && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {sub.items.map((f) => {
            const qr = qrMap[f.id];
            return (
              <div key={f.id} className="text-center">
                <img
                  src={f.imageRef}
                  alt={f.name}
                  className={`w-full h-48 object-contain rounded ${
                    f.owned ? "" : "filter grayscale opacity-50"
                  }`}
                />
                <p className="mt-2 text-sm font-medium">{f.name}</p>
                {!f.owned && !qr && (
                  <button
                    className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded"
                    onClick={() => handleAdd(f.id)}
                  >
                    Je l'ai
                  </button>
                )}
                {/* QR généré : l’image est un lien vers la page de vérification */}
                {!f.owned && qr && (
                  <div className="mt-2">
                    <img
                      src={qr}
                      alt={`QR code pour vérifier ${f.name}`}
                      className="w-24 h-24 mx-auto cursor-pointer"
                    />
                  </div>
                )}

                {f.owned && (
                  <span className="inline-block mt-2 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                    Vérifié ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
