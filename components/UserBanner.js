// components/UserBanner.js
import { useState, useEffect } from 'react';

// Exemple simple de liste d'avatars prédéfinis
const AVATARS = [
  '/images/avatars/amber_avatar.png',
  '/images/avatars/in_the_garden_avatar.png',
  '/images/avatars/luck_avatar.png',
  '/images/avatars/secret_avatar.png',
];

// Exemple minimaliste de liste de pays
const COUNTRIES = [
  { code: 'FR', label: 'France' },
  { code: 'US', label: 'États-Unis' },
  { code: 'JP', label: 'Japon' },
  { code: 'DE', label: 'Allemagne' },
];

export default function UserBanner({ userId, name, avatar, bio, country, count }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ avatar, bio, country });

  useEffect(() => {
    setForm({ avatar, bio, country });
  }, [avatar, bio, country]);

  const handleSave = async () => {
    const res = await fetch('/api/user/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        avatar: form.avatar,
        bio: form.bio,
        country: form.country
      }),
    });
    if (res.ok) {
      setShowModal(false);
      window.location.reload();
    } else {
      alert(res.statusText);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <img
            src={avatar || AVATARS[0]}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold">{name}</h1>
            <h2 className="text-2xl font-bold">{count} figurines</h2>
            <p className="text-gray-600">Pays : {country || 'Non précisé'}</p>
          </div>
        </div>
        <p className="text-gray-700 flex-1 mx-8">{bio || 'Aucune bio renseignée.'}</p>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Modifier
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg w-11/12 max-w-md">
            <h3 className="text-xl font-semibold mb-4">Modifier mon profil</h3>

            {/* Sélecteur d'avatar */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              {AVATARS.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt="Avatar option"
                  onClick={() => setForm(prev => ({ ...prev, avatar: url }))}
                  className={`w-16 h-16 rounded-full cursor-pointer border-2 ${
                    form.avatar === url ? 'border-indigo-600' : 'border-transparent'
                  }`}
                />
              ))}
            </div>

            {/* Sélecteur de pays */}
            <div className="mb-4">
              <label className="block mb-1">Pays</label>
              <select
                className="w-full p-2 border rounded"
                value={form.country || ''}
                onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
              >
                <option value="">Choisir...</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.label}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <label className="block mb-1">Bio</label>
              <textarea
                className="w-full p-2 border rounded"
                rows={3}
                value={form.bio || ''}
                onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Ta bio..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
