// Samantha köprüsü: telefondaki sayfa buraya sorar, bu fonksiyon NVIDIA'ya iletir.
// NVIDIA anahtarı Vercel'deki gizli ayarda (NVIDIA_API_KEY) durur, sayfada görünmez.
const ALLOWED = [/^https:\/\/kayahandemirbas\.github\.io$/, /^https:\/\/[a-z0-9-]+\.vercel\.app$/];

module.exports = async (req, res) => {
  const origin = req.headers.origin || "";
  if (ALLOWED.some((r) => r.test(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST gerekli" });
  if (origin && !ALLOWED.some((r) => r.test(origin))) return res.status(403).json({ error: "izin yok" });

  const key = process.env.NVIDIA_API_KEY;
  if (!key) return res.status(500).json({ error: "NVIDIA_API_KEY ayarlanmamış" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const messages = Array.isArray(body && body.messages) ? body.messages.slice(-24) : [];
  if (!messages.length) return res.status(400).json({ error: "mesaj yok" });

  try {
    const r = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", authorization: "Bearer " + key },
      body: JSON.stringify({
        model: (body.model && String(body.model).slice(0, 80)) || "meta/llama-3.3-70b-instruct",
        messages,
        max_tokens: 500,
        temperature: 0.6,
      }),
    });
    const text = await r.text();
    res.status(r.status).setHeader("content-type", "application/json");
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ error: "NVIDIA'ya ulaşılamadı" });
  }
};
