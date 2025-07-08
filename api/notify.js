let usedNonces = new Set();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, msg: "Method not allowed" });
  }

  const { token, rarity, displayName, players, link, LocalPlayer } = req.body || {};
  if (!token) {
    return res.status(400).json({ ok: false, msg: "Missing token" });
  }

  let raw = "";
  try {
    const bytes = [];
    for (let i = 0; i < token.length; i += 2) {
      const hex = token.slice(i, i + 2);
      const b = parseInt(hex, 16) ^ 0xAA;
      bytes.push(b);
    }
    raw = String.fromCharCode(...bytes);
  } catch (err) {
    return res.status(400).json({ ok: false, msg: "Invalid HEX token" });
  }

  const [secret, nonce] = raw.split(':');
  if (secret !== "IIkanLeleBro") {
    return res.status(403).json({ ok: false, msg: "Secret mismatch" });
  }

  if (!nonce || usedNonces.has(nonce)) {
    return res.status(403).json({ ok: false, msg: "Nonce reused or missing" });
  }

  usedNonces.add(nonce);
  setTimeout(() => usedNonces.delete(nonce), 5 * 60 * 1000);

  const embed = {
  title: `Someone Has Found A ${rarity} - ${displayName}!`,
  description: `[Join Here](${link})`,
  color: 0x00FF00,
  fields: [
    { name: "Found By",          value: LocalPlayer || "Unknown", inline: true },
    { name: "Players Inside",    value: `${players}`,              inline: true }
  ],
  timestamp: new Date().toISOString(),
  footer: {
    text: "Makal Hub • Brainrot Notifier",
    icon_url: "https://media.discordapp.net/attachments/1279117246836375593/1384781511697633310/download.webp"
  }
};

  const webhook = process.env.WEBHOOK_URL;
  if (!webhook) {
    return res.status(500).json({ ok: false, msg: "Missing WEBHOOK_URL env" });
  }

  const webhookRes = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] })
  });

  if (!webhookRes.ok) {
    return res.status(500).json({ ok: false, msg: "Webhook failed" });
  }

  return res.status(200).json({ ok: true, msg: "Sent to webhook" });
}
