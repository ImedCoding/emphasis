import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import prisma from '../../../lib/prisma';

export default function Verify({ userId, figurineId, figurine }) {
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streamOk, setStreamOk] = useState(false);
  const [step, setStep] = useState(1);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // Init caméra à l'étape 2
  useEffect(() => {
    let stream;
    if (step === 2) {
      (async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setStreamOk(true);
          }
        } catch (e) {
          console.warn('getUserMedia indisponible, fallback file input', e);
          setStreamOk(false);
        }
      })();
    }
    return () => {
      if (stream && typeof stream.getTracks === 'function') {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [step]);

  const takePicture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob((blob) => {
      setPhotoBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setStep(3);
    }, 'image/jpeg', 0.92);
  };

  const onFallbackFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoBlob(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStep(3);
  };

  const submitProof = async () => {
    if (!photoBlob) return;
    setLoading(true);
    const form = new FormData();
    form.append('photo', photoBlob, 'proof.jpg');
    try {
      const res = await fetch(`/api/collections/${userId}/${figurineId}/upload`, {
        method: 'POST',
        body: form
      });
      if (!res.ok) throw new Error('Upload failed');
      setStep(4); // succès visuel
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l’upload');
    } finally {
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
              Scannez ce QR avec votre téléphone. Appuyez ensuite sur « Commencer » pour ouvrir la caméra et prendre la photo de votre figurine.
            </p>
            <button onClick={() => setStep(2)} className="w-full py-2 bg-indigo-600 text-white rounded">
              Commencer
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {streamOk ? (
              <div className="space-y-4">
                <video ref={videoRef} playsInline muted className="w-full rounded border" />
                <button onClick={takePicture} className="w-full py-2 bg-indigo-600 text-white rounded">
                  Prendre la photo
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Votre appareil ne permet pas l’accès direct à la caméra. Utilisez ce bouton pour prendre une photo :
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onFallbackFile}
                  className="w-full"
                />
              </div>
            )}
            <button onClick={() => setStep(1)} className="mt-4 px-4 py-2 bg-gray-300 rounded">
              Retour
            </button>
          </>
        )}

        {step === 3 && (
          <>
            {previewUrl && <img src={previewUrl} alt="Aperçu" className="mb-4 w-full h-64 object-contain rounded" />}
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-300 rounded" disabled={loading}>
                Reprendre
              </button>
              <button onClick={submitProof} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50" disabled={loading}>
                {loading ? 'Envoi…' : 'Valider la photo'}
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <p className="text-green-700 font-semibold">Photo enregistrée ! Vous pouvez fermer cette page.</p>
        )}
      </div>
      {/* Canvas hors-écran pour capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const { userId, figurineId } = params;
  const figurine = await prisma.figurine.findUnique({
    where: { id: figurineId },
    select: { name: true }
  });
  if (!figurine) return { notFound: true };
  return { props: { userId, figurineId, figurine } };
}
