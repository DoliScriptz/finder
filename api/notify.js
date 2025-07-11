import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, msg: 'Unauthorized' });

  const { token, rarity, displayName, players, link } = req.body || {};
  if (!token) return res.status(400).json({ ok: false, msg: 'Missing token' });

  const parts = token.split(':');
  if (parts.length !== 4) return res.status(400).json({ ok: false, msg: 'Invalid token format' });

  const [userid, username, exp, sig] = parts;
  const payload = `${userid}:${username}:${exp}`;
  const check = crypto.createHmac('sha256', process.env.HWID_SECRET).update(payload).digest('hex');

  if (sig !== check) return res.status(403).json({ ok: false, msg: 'Invalid signature' });
  if (Date.now() > parseInt(exp)) return res.status(403).json({ ok: false, msg: 'Token expired' });

  const embed = {
    title: `Someone Has Found A ${rarity} - ${displayName}!`,
    description: `[Join Here](${link})`,
    color: 0x00FF00,
    fields: [
      { name: "Found By", value: username, inline: true },
      { name: "User ID", value: userid, inline: true },
      { name: "Players Inside", value: `${players}`, inline: true }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Makal Hub • Brainrot Notifier",
      icon_url: "https://media.discordapp.net/attachments/1279117246836375593/1384781511697633310/download.webp"
    }
  };

  const webhook = process.env.WEBHOOK_URL;
  if (!webhook) return res.status(500).json({ ok: false, msg: 'Missing WEBHOOK_URL env' });

  const resp = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] })
  });

  if (!resp.ok) return res.status(500).json({ ok: false, msg: 'Webhook failed' });

  return res.status(200).json({ ok: true, msg: 'Sent to webhook' });
}
