// Fichier : components/CollectionGroupNested.js
import { useState } from 'react';

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
  return (
    <div className="space-y-8">
      {collections.map(col => (
        <div key={col.collection} className="bg-white rounded-lg shadow">
          {/* En-tête de la collection */}
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">{col.collection}</h2>
          </div>
          <div className="p-6 space-y-4">
            {col.subSeries.map(sub => (
              <SubSeriesGroup key={sub.series} sub={sub} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SubSeriesGroup({ sub }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 py-2 bg-gray-100 rounded-md"
      >
        <span className="font-semibold">{sub.series}</span>
        <span className="text-lg">{open ? '–' : '+'}</span>
      </button>

      {open && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {sub.items.map(f => (
            <div key={f.id} className="text-center">
              <img
                src={f.imageRef}
                alt={f.name}
                className={`w-full h-48 object-contain rounded ${
                  f.owned ? '' : 'filter grayscale opacity-50'
                }`}
              />
              <p className="mt-2 text-sm font-medium">{f.name}</p>
              {!f.owned && (
                <button
                  className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded"
                  onClick={() => alert(`Je l'ai: ${f.name}`)}
                >
                  Je l'ai
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
