// components/CollectionGroup.js
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function CollectionGroup({ collections, readonly = false }) {
  const { data: session } = useSession();
  // pour le flux "Je l'ai" (QR visible jusqu'à vérification)
  const [qrMap, setQrMap] = useState({});

  const handleAdd = async (figurineId) => {
    if (readonly) return; // pas d'action en lecture seule
    if (!session) {
      alert('Veuillez vous connecter.');
      return;
    }
    try {
      const res = await fetch(
        `/api/collections/${session.user.id}/${figurineId}`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec de la requête');
      setQrMap((prev) => ({ ...prev, [figurineId]: data.qrCode }));
    } catch (err) {
      console.error(err);
      alert("Impossible de générer le QR code.");
    }
  };

  return (
    <>
      {collections.map((group) => (
        <div key={group.collection} className="bg-white rounded-lg shadow mb-8">
          <h3 className="px-6 py-3 font-semibold bg-gray-50 border-b">
            {group.collection}
          </h3>

          {group.subSeries.map((ss) => (
            <details key={ss.series}>
              <summary className="px-6 py-3 cursor-pointer font-medium">
                {ss.series}
              </summary>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                {ss.items.map((item) => {
                  const qr = qrMap[item.id];

                  return (
                    <div key={item.id} className="text-center">
                      <img
                        src={item.imageRef}
                        alt={item.name}
                        className={`w-full h-48 object-contain rounded ${
                          item.owned ? '' : 'filter grayscale opacity-50'
                        }`}
                        draggable={false}
                      />
                      <p className="mt-2 text-sm font-medium">{item.name}</p>

                      {/* En lecture seule: aucun bouton/QR */}
                      {readonly ? (
                        item.owned ? (
                          <span className="inline-block mt-2 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                            Vérifié ✓
                          </span>
                        ) : null
                      ) : (
                        <>
                          {!item.owned && !qr && (
                            <button
                              onClick={() => handleAdd(item.id)}
                              className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded"
                            >
                              Je l&apos;ai
                            </button>
                          )}

                          {/* QR généré : affichage non cliquable */}
                          {!item.owned && qr && (
                            <div className="mt-2">
                              <img
                                src={qr}
                                alt={`QR à scanner avec votre téléphone pour ${item.name}`}
                                className="w-24 h-24 mx-auto select-none pointer-events-none cursor-default"
                                draggable={false}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Scannez avec votre téléphone
                              </p>
                            </div>
                          )}

                          {item.owned && (
                            <span className="inline-block mt-2 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                              Vérifié ✓
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      ))}
    </>
  );
}
