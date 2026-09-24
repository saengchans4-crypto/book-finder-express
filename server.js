const express = require('express');
const path = require('path');
const app = express();

/* ==========================================================================
   DSA: Custom Hash Table (เขียนเองด้วย Array of Buckets + Hash Function + Chaining)
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

const apiCache = new CustomHashTable(128);

// เสิร์ฟไฟล์ Static จากโฟลเดอร์ public
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint: ค้นหาหนังสือ
app.get('/api/search', async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 18;
    const offset = (page - 1) * limit;

    if (!query) {
      return res.json({ docs: [], numFound: 0, page, limit });
    }

    const cacheKey = `search:${query.toLowerCase()}:${page}:${limit}`;
    if (apiCache.has(cacheKey)) {
      return res.json({ ...apiCache.get(cacheKey), cached: true });
    }

    const fields = 'key,title,author_name,first_publish_year,edition_count,subject,cover_i';
    const targetUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=${fields}&offset=${offset}&limit=${limit}`;

    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Open Library API responded with status ${response.status}`);
    }

    const data = await response.json();
    const resultPayload = {
      docs: data.docs || [],
      numFound: data.numFound || 0,
      page,
      limit
    };

    apiCache.set(cacheKey, resultPayload);
    res.json({ ...resultPayload, cached: false });
  } catch (error) {
    console.error('Express Search API Error:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลจาก Open Library ได้', details: error.message });
  }
});

// API Endpoint: ดึงรายละเอียดหนังสือรายเล่ม
app.get('/api/work', async (req, res) => {
  try {
    const workKey = req.query.key;
    if (!workKey) return res.status(400).json({ error: 'Missing work key' });

    const cacheKey = `work:${workKey}`;
    if (apiCache.has(cacheKey)) {
      return res.json({ ...apiCache.get(cacheKey), cached: true });
    }

    const targetUrl = `https://openlibrary.org${workKey}.json`;
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error('Work fetch error');

    const data = await response.json();
    apiCache.set(cacheKey, data);
    res.json({ ...data, cached: false });
  } catch (error) {
    res.status(500).json({ error: 'ไม่สามารถดึงรายละเอียดหนังสือได้' });
  }
});

// Fallback Route สำหรับ Express 5 (ไม่ใช้ '*')
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;