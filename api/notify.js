let usedNonces = new Set();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { token, rarity, displayName, players, link } = req.body || {};
  if (!token) return res.status(400).json({ ok: false, msg: "Missing token" });

  let raw;
  try {
    const decoded = Buffer.from(token, 'base64');
    const decrypted = decoded.map(b => b ^ 123);
    raw = String.fromCharCode(...decrypted);
  } catch {
    return res.status(400).json({ ok: false, msg: "Bad token" });
  }

  const [secret, nonce] = raw.split(':');
  if (secret !== "IIkanLeleBro") return res.status(403).json({ ok: false, msg: "Secret mismatch" });
  if (usedNonces.has(nonce)) return res.status(403).json({ ok: false, msg: "Nonce reused" });

  usedNonces.add(nonce);
  setTimeout(() => usedNonces.delete(nonce), 5 * 60_1000); // auto clean

  const embed = {
    title: `Found ${rarity} - ${displayName}`,
    description: link || "No link",
    fields: [
      { name: "Players", value: String(players) },
      { name: "Nonce", value: nonce }
    ],
    timestamp: new Date().toISOString()
  };

  await fetch(process.env.WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] })
  });

  res.status(200).json({ ok: true });
}
