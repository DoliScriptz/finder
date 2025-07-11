import crypto from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, msg: 'Method not allowed' });

  const { userid, username } = req.body || {};
  if (!userid || !username) return res.status(400).json({ ok: false, msg: 'Missing userid or username' });

  const exp = Date.now() + 20 * 1000; // 20s expiry
  const payload = `${userid}:${username}:${exp}`;
  const sig = crypto.createHmac('sha256', process.env.HWID_SECRET).update(payload).digest('hex');

  return res.status(200).json({ ok: true, token: `${payload}:${sig}` });
}
