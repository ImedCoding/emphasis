import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

export default function Verify() {
  const videoRef = useRef(null);
  const router = useRouter();
  const { userId, figurineId } = router.query;

  useEffect(() => {
    if (!videoRef.current) return;
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(s => {
        videoRef.current.srcObject = s;
      })
      .catch(console.error);
  }, [videoRef]);

  const takePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async blob => {
      const fd = new FormData();
      fd.append('file', blob, 'proof.png');
      const res = await fetch(
        `/api/collections/${userId}/${figurineId}/upload`,
        { method: 'POST', body: fd }
      );
      if (res.ok) alert('Preuve uploadée !');
    });
  };

  return (
    <div className="p-4">
      <h1>Vérification de possession</h1>
      <video ref={videoRef} autoPlay playsInline className="border rounded" />
      <button
        onClick={takePhoto}
        className="mt-2 p-2 bg-blue-600 text-white rounded"
      >
        Prendre une photo
      </button>
    </div>
  );
}