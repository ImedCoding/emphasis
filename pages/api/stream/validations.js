// pages/api/stream/validations.js
import { addClient, removeClient } from '../../../lib/realtime';

export default function handler(req, res) {
  const { userId } = req.query;
  if (!userId) {
    res.status(400).end('Missing userId');
    return;
  }

  // Headers SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  // Ping initial + keep-alive
  res.write(': ok\n\n');
  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000);

  addClient(String(userId), res);

  req.on('close', () => {
    clearInterval(keepAlive);
    removeClient(String(userId), res);
  });
}
