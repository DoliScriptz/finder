import crypto from "crypto";

const used = new Set();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { token, rarity, displayName, players, link } = req.body || {};
  if (!token) return res.status(400).end();

  const parts = token.split(":");
  if (parts.length !== 4) return res.status(400).end();

  const [userid, username, exp, sig] = parts;
  const payload = `${userid}:${username}:${exp}`;
  const validSig = crypto
    .createHmac("sha256", process.env.HWID_SECRET)
    .update(payload)
    .digest("hex");

  if (sig !== validSig) return res.status(403).end();
  if (used.has(sig)) return res.status(403).end();
  if (Date.now() > parseInt(exp)) return res.status(403).end();

  used.add(sig);
  setTimeout(() => used.delete(sig), 5 * 60_000);

  const embed = {
    title: `Found ${rarity} - ${displayName}`,
    description: `[Join Here](${link})`,
    color: 0x00ff00,
    fields: [
      { name: "User", value: username, inline: true },
      { name: "Players", value: `${players}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };

  await fetch(process.env.WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  res.status(200).end();
}
