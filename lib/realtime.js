// lib/realtime.js
// ✅ Persiste entre reloads en dev
const clients =
  globalThis.__SSE_CLIENTS__ ?? (globalThis.__SSE_CLIENTS__ = new Map());

export function addClient(userId, res) {
  let set = clients.get(userId);
  if (!set) {
    set = new Set();
    clients.set(userId, set);
  }
  set.add(res);
}

export function removeClient(userId, res) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(userId);
}

export function sendValidationEvent(userId, payload) {
  const set = clients.get(userId);
  if (!set) return;
  const line = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) res.write(line);
}
