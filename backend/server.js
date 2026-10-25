const express = require('express');
const app = express();

/* ==========================================================================
   DSA: Custom Hash Table (Array of Buckets + Hash Function + Chaining)
   get/set เฉลี่ย O(1), กรณีแย่สุด O(n) เมื่อทุก key ชนกันใน bucket เดียว
   ========================================================================== */
class CustomHashTable {
  constructor(size = 64) {
    this.buckets = Array.from({ length: size }, () => []);
    this.count = 0;
  }

  _hash(key) {
    let hash = 0;
    const keyStr = String(key);
    for (let i = 0; i < keyStr.length; i++) {
      hash = (hash * 31 + keyStr.charCodeAt(i)) % this.buckets.length;
    }
    return hash;
  }

  set(key, value) {
    const index = this._hash(key);
    const bucket = this.buckets[index];
    for (let pair of bucket) {
      if (pair[0] === key) {
        pair[1] = value;
        return;
      }
    }
    bucket.push([key, value]);
    this.count++;
  }

  get(key) {
    const index = this._hash(key);
    const bucket = this.buckets[index];
    for (let [k, v] of bucket) {
      if (k === key) return v;
    }
    return undefined;
  }

  has(key) {
    return this.get(key) !== undefined;
  }
}

/* ===== Cache: เก็บใน Hash Table พร้อมเวลาหมดอายุ (TTL 1 ชั่วโมง) ===== */
const apiCache = new CustomHashTable(128);
const CACHE_TTL_MS = 60 * 60 * 1000;

function cacheGet(key) {
  const hit = apiCache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expires) return undefined; // หมดอายุ = นับเป็น miss
  return hit.value;
}

function cacheSet(key, value) {
  apiCache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

/* ===== เรียก Open Library พร้อม timeout 15 วินาที กันค้าง ===== */
async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    throw new Error(`Open Library responded with status ${response.status}`);
  }
  return response.json();
}

/* ===== API: ค้นหาหนังสือ ===== */
app.get('/api/search', async (req, res) => {
  const started = Date.now();

  // --- validate ---
  const query = String(req.query.q || '').trim();
  const page = Number.parseInt(req.query.page, 10) || 1;
  const limit = Number.parseInt(req.query.limit, 10) || 18;

  if (query.length > 100) {
    return res.status(400).json({ error: 'คำค้นยาวเกิน 100 ตัวอักษร' });
  }
  if (page < 1 || page > 50 || limit < 1 || limit > 40) {
    return res.status(400).json({ error: 'page ต้องอยู่ 1-50 และ limit ต้องอยู่ 1-40' });
  }
  if (!query) {
    return res.json({ docs: [], numFound: 0, page, limit, cached: false, ms: 0 });
  }

  try {
    const cacheKey = `search:${query.toLowerCase()}:${page}:${limit}`;
    const hit = cacheGet(cacheKey);
    if (hit) {
      return res.json({ ...hit, cached: true, ms: Date.now() - started });
    }

    const offset = (page - 1) * limit;
    const fields = 'key,title,author_name,first_publish_year,edition_count,subject,cover_i';
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=${fields}&offset=${offset}&limit=${limit}`;

    const data = await fetchJson(url);
    const payload = {
      docs: data.docs || [],
      numFound: data.numFound || 0,
      page,
      limit,
    };

    cacheSet(cacheKey, payload);
    res.json({ ...payload, cached: false, ms: Date.now() - started });
  } catch (error) {
    
console.error('Search error:', error);
console.error('Error cause:', error.cause);

res.status(502).json({
  error: 'ไม่สามารถดึงข้อมูลจาก Open Library ได้ ลองใหม่อีกครั้ง'
});

  }
});

/* ===== API: รายละเอียดหนังสือรายเล่ม ===== */
app.get('/api/work', async (req, res) => {
  const started = Date.now();
  const workKey = String(req.query.key || '');

  // key ต้องหน้าตาแบบ /works/OL123W เท่านั้น กัน path แปลก ๆ
  if (!/^\/works\/OL\d+W$/.test(workKey)) {
    return res.status(400).json({ error: 'รูปแบบ key ไม่ถูกต้อง (ต้องเป็น /works/OL...W)' });
  }

  try {
    const cacheKey = `work:${workKey}`;
    const hit = cacheGet(cacheKey);
    if (hit) {
      return res.json({ ...hit, cached: true, ms: Date.now() - started });
    }

    const data = await fetchJson(`https://openlibrary.org${workKey}.json`);
    cacheSet(cacheKey, data);
    res.json({ ...data, cached: false, ms: Date.now() - started });
  } catch (error) {
    console.error('Work error:', error.message);
    res.status(502).json({ error: 'ไม่สามารถดึงรายละเอียดหนังสือได้' });
  }
});

/* ===== route ที่ไม่มี → 404 แบบ JSON ===== */
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/* ===== Warm-up: โหลดหมวดที่ใช้สุ่มเก็บใน cache ล่วงหน้า ให้ปุ่มสุ่มตอบทันที ===== */
const WARM_SEEDS = ['love', 'war', 'space', 'mystery', 'ocean', 'dream', 'city', 'magic', 'journey', 'science'];

async function warmCache(force = false) {
  for (const seed of WARM_SEEDS) {
    const key = `search:${seed}:1:18`; // รูปแบบ key ต้องตรงกับที่ /api/search ใช้
    if (!force && cacheGet(key)) continue; // force = โหลดทับแม้ยังไม่หมดอายุ
    try {
      const fields = 'key,title,author_name,first_publish_year,edition_count,subject,cover_i';
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(seed)}&fields=${fields}&offset=0&limit=18`;
      const data = await fetchJson(url);
      cacheSet(key, { docs: data.docs || [], numFound: data.numFound || 0, page: 1, limit: 18 });
    } catch (error) {
      console.error('warm-up skip:', seed, error.message);
    }
  }
  console.log('Cache warm-up done');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  warmCache();                                 // ทำเบื้องหลัง ไม่ block เซิร์ฟเวอร์
  setInterval(() => warmCache(true), 50 * 60 * 1000); // โหลดทับใหม่ก่อน cache หมดอายุ (TTL 60 นาที)
});

module.exports = app;