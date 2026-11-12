// Serati Lens — fungsi server (Vercel) untuk mengenali foto upakara dengan Claude API.
// Kunci API disimpan sebagai Environment Variable ANTHROPIC_API_KEY di Vercel, BUKAN di kode ini.
// Opsional: LENS_MODEL (default "claude-haiku-5-5").

const CATALOG = "- canang-sari | Canang Sari | Canang | ciri: Ceper kecil persegi atau bulat dengan sampian bintang/bundar di atasnya; bunga empat warna tersusun per sisi; kembang rampe hijau di tengah; ada irisan tebu, pisang, atau jajan di bawah sampian.\n- canang-genten | Canang Genten | Canang | ciri: Kecil dan sederhana; hanya satu wadah bunga kerucut atau bundar; tidak ada irisan tebu, pisang, atau jajan.\n- canang-burat-wangi | Canang Burat Wangi (Canang Lenga Wangi–Burat Wangi) | Canang | ciri: Ada tiga wadah kecil: pasta kuning (burat wangi), minyak gelap, dan minyak bening; bagian atas seperti canang genten.\n- canang-pasucian | Canang Pasucian (Canang Pabersihan) | Canang | ciri: Banyak wadah kecil (tujuh celemik) berisi bubuk berwarna: hitam (sisig), hijau (ambuh), kuning (kekosok), putih (tepung tawar).\n- canang-gantal | Canang Gantal | Canang | ciri: Ada ikatan gulungan sirih (tujuh gulungan) yang terlihat jelas di bawah sampian.\n- canang-pangraos | Canang Pangraos | Canang | ciri: Dua tingkat; terlihat kojong-kojong kecil, lembaran sirih, tembakau, dan rokok; canang sari di puncak.\n- canang-tubungan | Canang Tubungan | Canang | ciri: Dua gulungan sirih bersilang (bentuk X) di bawah sampian.\n- canang-tadah-sukla | Canang Tadah Sukla (Tadah Pawitra) | Canang | ciri: Mirip canang genten, tetapi ada satu wadah kecil berisi potongan umbi dan kacang goreng berwarna cokelat.\n- canang-raka | Canang Raka (Canang Meraka) | Canang | ciri: Lebih besar dari canang sari; isi buah dan jajan terlihat jelas; sampian di atasnya.\n- canang-rebong | Canang Rebong | Canang | ciri: Tinggi dan menjulang, didominasi bunga warna-warni yang ditancapkan rapat pada batang di atas dulang.\n- gebogan-woh-wohan | Gebogan Woh-wohan | Gebogan | ciri: Menara kerucut di atas dulang kayu, didominasi buah utuh (jeruk, salak, apel, pisang, dan lainnya), sampian janur di puncak.\n- gebogan-jaja | Gebogan Jaja | Gebogan | ciri: Menara kerucut yang didominasi jajan berwarna (putih, merah muda, cokelat), bukan buah.\n- gebogan-bunga | Gebogan Bunga | Gebogan | ciri: Menara kerucut yang hampir seluruhnya bunga (oranye gumitir, putih jepun), tanpa buah besar.\n- gebogan-agung | Gebogan Agung | Gebogan | ciri: Jauh lebih tinggi dari gebogan biasa; campuran buah, jajan, dan bunga; sampian besar di puncak.\n- sampian-canang-sari | Sampian Canang Sari (Sampian Uras Sari) | Sampian | ciri: Anyaman janur kuning-hijau muda berbentuk bintang atau bunga bundar, kosong tanpa makanan.\n- sampian-sodan | Sampian Sodan (Sampian Plaus / Kepet-kepetan) | Sampian | ciri: Anyaman janur melebar seperti kipas, biasanya di atas banten berisi nasi atau penek dan lauk.\n- sampian-pejati | Sampian Pejati (Sampian Peras) | Sampian | ciri: Sampian janur yang lebih besar dan bertingkat, berada di puncak banten peras dalam satu set pejati.\n- sampian-gantung | Sampian Gantung | Sampian | ciri: Anyaman janur menjuntai ke bawah dan tergantung, sering bersama lamak (panel janur panjang).\n- tamiang | Tamiang | Sampian | ciri: Bundar seperti perisai atau roda dengan pola janur memancar dari tengah.\n- segehan-kepel-putih | Segehan Kepel Putih | Segehan | ciri: Alas daun kecil berisi dua bulatan nasi putih, irisan bawang dan jahe, sedikit garam.\n- segehan-putih-kuning | Segehan Putih Kuning | Segehan | ciri: Dua bulatan nasi berbeda warna, putih dan kuning, berdampingan.\n- segehan-manca-warna | Segehan Manca Warna | Segehan | ciri: Empat atau lima bulatan nasi berbeda warna (putih, merah, kuning, hitam) tersusun melingkar di atas daun.\n- segehan-cacahan | Segehan Cacahan (Segehan Cah-cahan) | Segehan | ciri: Nasi terlihat berbutir dan tersebar, bukan bulatan padat.\n- segehan-agung | Segehan Agung | Segehan | ciri: Lebih besar dan terdiri dari banyak tanding segehan sekaligus.";
const IDS = new Set(["canang-sari","canang-genten","canang-burat-wangi","canang-pasucian","canang-gantal","canang-pangraos","canang-tubungan","canang-tadah-sukla","canang-raka","canang-rebong","gebogan-woh-wohan","gebogan-jaja","gebogan-bunga","gebogan-agung","sampian-canang-sari","sampian-sodan","sampian-pejati","sampian-gantung","tamiang","segehan-kepel-putih","segehan-putih-kuning","segehan-manca-warna","segehan-cacahan","segehan-agung"]);
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_B64 = 4000000;          // ~3 MB gambar asli; foto dari aplikasi sudah dikompres ke ±300 KB
const RATE_LIMIT = 12;            // permintaan per menit per alamat IP (perlindungan sederhana)
const hits = new Map();

const PROMPT = "Kamu adalah fitur pengenal foto di aplikasi Serati, katalog upakara (sesajen) Hindu Bali. " +
  "Pengguna memotret satu benda. Cocokkan foto dengan SATU item dari katalog berikut berdasarkan ciri visualnya.\n\n" +
  "KATALOG (id | nama | kategori | ciri):\n" + CATALOG + "\n\n" +
  "Aturan:\n- Pilih id dari katalog saja. Jika foto bukan upakara Bali atau tidak cocok dengan item mana pun, isi \"id\": null.\n" +
  "- \"keyakinan\" antara 0 dan 1; jujur jika ragu (beberapa jenis canang tampak mirip).\n" +
  "- \"alasan\": 1-2 kalimat bahasa Indonesia tentang ciri yang terlihat di foto.\n" +
  "- \"alternatif\": maksimal 2 id lain yang mungkin, beserta keyakinannya.\n\n" +
  "Balas HANYA JSON: {\"id\": string|null, \"keyakinan\": number, \"alasan\": string, \"alternatif\": [{\"id\": string, \"keyakinan\": number}]}";

function clamp01(x) { const n = Number(x); return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0; }

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > RATE_LIMIT;
}

function parseModelJson(text) {
  const m = String(text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (e) { return null; }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.status(503).json({ error: "lens_not_configured" }); return; }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  if (rateLimited(ip)) { res.status(429).json({ error: "rate_limited" }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = null; } }
  const image = body && body.image;
  const mediaType = body && body.mediaType;
  if (typeof image !== "string" || !image || !ALLOWED_TYPES.has(mediaType) || !/^[A-Za-z0-9+/=]+$/.test(image)) {
    res.status(400).json({ error: "bad_request" }); return;
  }
  if (image.length > MAX_B64) { res.status(413).json({ error: "too_large" }); return; }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.LENS_MODEL || "claude-haiku-5-5",
        max_tokens: 400,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
          { type: "text", text: PROMPT }
        ] }]
      }),
      signal: ctrl.signal
    });
    if (!r.ok) {
      res.status(r.status === 429 ? 429 : 502).json({ error: r.status === 429 ? "rate_limited" : "upstream_error" });
      return;
    }
    const data = await r.json();
    const text = (Array.isArray(data.content) ? data.content : []).filter(b => b && b.type === "text").map(b => b.text).join("");
    const out = parseModelJson(text);
    if (!out || typeof out !== "object") { res.status(502).json({ error: "invalid_json" }); return; }
    const id = typeof out.id === "string" && IDS.has(out.id) ? out.id : null;
    const alternatif = (Array.isArray(out.alternatif) ? out.alternatif : [])
      .filter(a => a && IDS.has(a.id) && a.id !== id).slice(0, 2)
      .map(a => ({ id: a.id, keyakinan: clamp01(a.keyakinan) }));
    res.status(200).json({ id, keyakinan: clamp01(out.keyakinan), alasan: String(out.alasan || "").slice(0, 400), alternatif });
  } catch (e) {
    res.status(e && e.name === "AbortError" ? 504 : 502).json({ error: "upstream_error" });
  } finally {
    clearTimeout(timer);
  }
};
