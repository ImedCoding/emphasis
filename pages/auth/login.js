import { signIn } from 'next-auth/react';
import { useState } from 'react';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = async e => {
    e.preventDefault();
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res.ok) window.location.href = '/profile';
    else alert('Identifiants incorrects');
  };
  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-4">
      <h1 className="text-xl mb-4">Connexion</h1>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="mb-2 w-full p-2 border rounded"/>
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="mb-4 w-full p-2 border rounded"/>
      <button type="submit" className="w-full p-2 bg-green-600 text-white rounded">Se connecter</button>
    </form>
  );
}