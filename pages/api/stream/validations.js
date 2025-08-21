// pages/api/stream/validations.js
import { addClient, removeClient } from '../../../lib/realtime';

// (utile si tu utilises l'app router/edge quelque part)
export const config = { api: { bodyParser: false } };

export default function handler(req, res) {
  const { userId } = req.query;
  if (!userId) {
    res.status(400).end('Missing userId');
    return;
  }

  // Entêtes SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // désactive d'éventuels buffers (nginx, etc.)
    'X-Accel-Buffering': 'no',
  });

  // ping initial + keep-alive
  res.write(': connected\n\n');
  const ka = setInterval(() => res.write(': ping\n\n'), 20000);

  addClient(String(userId), res);

  req.on('close', () => {
    clearInterval(ka);
    removeClient(String(userId), res);
  });
}
