import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const router = useRouter();

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
    if (res.ok) router.push('/auth/login');
    else alert('Erreur lors de l\'inscription');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-4">
      <h1 className="text-xl mb-4">Créer un compte</h1>
      <input type="text" placeholder="Nom" value={name} onChange={e => setName(e.target.value)} required className="mb-2 w-full p-2 border rounded"/>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="mb-2 w-full p-2 border rounded"/>
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="mb-4 w-full p-2 border rounded"/>
      <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">S'inscrire</button>
    </form>
  );
}