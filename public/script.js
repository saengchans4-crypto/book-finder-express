/* ==========================================================================
   Helper Function: ป้องกันปัญหา Cross-Site Scripting (XSS)
   ========================================================================== */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   DSA #1: Custom Hash Table (สำหรับฝั่ง Client-side Book Lookup)
   ========================================================================== */
class CustomHashTable {
  constructor(size = 64) {
    this.buckets = Array.from({ length: size }, () => []);
  }
  _hash(key) {
    let hash = 0;
    const str = String(key);
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % this.buckets.length;
    }
    return hash;
  }
  set(key, value) {
    const bucket = this.buckets[this._hash(key)];
    for (let pair of bucket) {
      if (pair[0] === key) { pair[1] = value; return; }
    }
    bucket.push([key, value]);
  }
  get(key) {
    const bucket = this.buckets[this._hash(key)];
    for (let [k, v] of bucket) { if (k === key) return v; }
    return undefined;
  }
  has(key) { return this.get(key) !== undefined; }
}
const bookCache = new CustomHashTable(128);

/* ==========================================================================
   DSA #2: Custom Merge Sort (เขียนเองโดยไม่ใช้ Array.prototype.sort)
   ========================================================================== */
function mergeSort(arr, cmp) {
  if (arr.length <= 1) return arr;
  const mid = arr.length >> 1;
  const left = mergeSort(arr.slice(0, mid), cmp);
  const right = mergeSort(arr.slice(mid), cmp);
  const out = []; let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    out.push(cmp(left[i], right[j]) <= 0 ? left[i++] : right[j++]);
  }
  return out.concat(left.slice(i)).concat(right.slice(j));
}

/* ==========================================================================
   DSA #3: Trie for Autocomplete
   ========================================================================== */
class TrieNode { constructor() { this.children = {}; this.end = false; } }
class Trie {
  constructor() { this.root = new TrieNode(); }
  insert(word) {
    let node = this.root;
    for (const ch of word.toLowerCase()) {
      if (!node.children[ch]) node.children[ch] = new TrieNode();
      node = node.children[ch];
    }
    node.end = true;
  }
  wordsWithPrefix(prefix) {
    let node = this.root;
    for (const ch of prefix.toLowerCase()) {
      if (!node.children[ch]) return [];
      node = node.children[ch];
    }
    const results = [];
    const walk = (n, acc) => {
      if (results.length >= 8) return;
      if (n.end) results.push(prefix + acc);
      for (const ch in n.children) walk(n.children[ch], acc + ch);
    };
    walk(node, "");
    return results;
  }
}
const titleTrie = new Trie();

/* ==========================================================================
   DSA #4: Bounded Stack (LIFO) - ประวัติการดูล่าสุด
   ========================================================================== */
class BoundedStack {
  constructor(limit = 8) { this.limit = limit; this.items = []; }
  push(item) {
    this.items = this.items.filter(i => i.key !== item.key);
    this.items.unshift(item);
    if (this.items.length > this.limit) this.items.pop();
  }
}
const recentStack = new BoundedStack(8);

/* ==========================================================================
   DSA #5: Queue (FIFO) - สำหรับจัดการ คิวการโหลดข้อมูลเพิ่มเติม
   ========================================================================== */
class Queue {
  constructor() { this.items = []; }
  enqueue(x) { this.items.push(x); }
  dequeue() { return this.items.shift(); }
  get size() { return this.items.length; }
}
const fetchQueue = new Queue();

/* ==========================================================================
   DSA #6b: Fisher–Yates Shuffle — ใช้เลือกคำค้นหาแบบสุ่ม (ไม่ลำเอียง)
   ========================================================================== */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// คำค้นหากว้าง ๆ สำหรับสุ่มหนังสือ — ตั้งใจไม่ใส่คำที่มักโยง Harry Potter เป็นอันดับแรก
const RANDOM_SEEDS = [
  'mystery', 'ocean', 'space', 'dragon', 'journey', 'music',
  'science', 'adventure', 'history', 'mountain', 'forest',
  'island', 'poetry', 'philosophy', 'cooking', 'war'
];

function pickRandomSeed() {
  return shuffleArray(RANDOM_SEEDS)[0];
}

/* ==========================================================================
   DSA #6: Binary Search (กระโดดไปค้นหาปีที่ใกล้เคียงที่สุดใน Array ที่เรียงแล้ว)
   ========================================================================== */
function binarySearchClosestYear(sortedArr, targetYear) {
  let lo = 0, hi = sortedArr.length - 1;
  if (hi < 0) return -1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const midYear = sortedArr[mid].first_publish_year || 0;
    if (midYear === targetYear) return mid;
    if (midYear < targetYear) lo = mid + 1; else hi = mid;
  }
  return lo;
}

/* ==========================================================================
   State & UI Elements
   ========================================================================== */
let currentBooks = [];
let currentQuery = "";
let currentPage = 1;
let totalResults = 0;
let compareMap = new Map();

const grid = document.getElementById('grid');
const statusEl = document.getElementById('status');
const suggestBox = document.getElementById('suggest');
const qInput = document.getElementById('q');
const paginationControls = document.getElementById('paginationControls');
const pageIndicator = document.getElementById('pageIndicator');
const loadmoreBtn = document.getElementById('loadmoreBtn');

/* ==========================================================================
   API Functions (ดึงข้อมูลผ่าน Express Backend)
   ========================================================================== */
async function fetchFromExpress(query, page = 1) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}&limit=18`);
  if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อ Express Server');
  return res.json();
}

async function runSearch(query, page = 1) {
  currentQuery = query;
  currentPage = page;
  currentBooks = [];
  grid.innerHTML = '';
  statusEl.textContent = 'กำลังค้นหาข้อมูล...';
  
  try {
    const data = await fetchFromExpress(query, page);
    const docs = data.docs || [];
    totalResults = data.numFound || 0;

    docs.forEach(d => {
      titleTrie.insert(d.title || '');
      bookCache.set(d.key, d);
    });

    currentBooks = docs;
    statusEl.textContent = `พบทั้งหมด ${totalResults.toLocaleString()} รายการ (หน้า ${page}) ${data.cached ? '⚡ [จาก Server Cache]' : ''}`;
    
    paginationControls.style.display = totalResults > 0 ? 'flex' : 'none';
    pageIndicator.textContent = `หน้า ${currentPage} / ${Math.ceil(totalResults / 18) || 1}`;
    
    // ตั้งค่า Queue สำหรับปุ่ม "โหลดเพิ่มในหน้านี้"
    fetchQueue.items = [];
    if (totalResults > currentBooks.length) {
      fetchQueue.enqueue(currentPage + 1);
    }
    loadmoreBtn.style.display = fetchQueue.size ? 'inline-block' : 'none';

    renderGrid();
  } catch (error) {
    statusEl.textContent = '❌ ' + error.message;
    paginationControls.style.display = 'none';
  }
}

/* ==========================================================================
   Sorting (ใช้ Custom Merge Sort)
   ========================================================================== */
function getSortedBooks() {
  const mode = document.getElementById('sortSel').value;
  if (mode === 'relevance') return currentBooks;
  
  if (mode === 'edition_desc') {
    return mergeSort([...currentBooks], (a, b) => (b.edition_count || 0) - (a.edition_count || 0));
  }
  if (mode === 'edition_asc') {
    return mergeSort([...currentBooks], (a, b) => (a.edition_count || 0) - (b.edition_count || 0));
  }
  if (mode === 'year_desc') {
    return mergeSort([...currentBooks], (a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0));
  }
  if (mode === 'year_asc') {
    return mergeSort([...currentBooks], (a, b) => (a.first_publish_year || 9999) - (b.first_publish_year || 9999));
  }
  if (mode === 'title_asc') {
    return mergeSort([...currentBooks], (a, b) => (a.title || '').localeCompare(b.title || ''));
  }
  return currentBooks;
}

document.getElementById('sortSel').onchange = renderGrid;

/* ==========================================================================
   Render UI Cards
   ========================================================================== */
function renderGrid() {
  const books = getSortedBooks();
  grid.innerHTML = '';

  if (!books.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">ไม่พบหนังสือที่คุณค้นหา</div>';
    return;
  }

  books.forEach(b => {
    const cover = b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : '';
    const tags = (b.subject || []).slice(0, 3);
    const div = document.createElement('div');
    div.className = 'card';
    
    div.innerHTML = `
      ${cover ? `<img src="${cover}" alt="${escapeHTML(b.title)}">` : `<div style="height:160px;background:var(--line);display:flex;align-items:center;justify-content:center;font-size:.75rem;color:var(--muted)">ไม่มีรูปปก</div>`}
      <h3 class="serif">${escapeHTML(b.title || 'ไม่ทราบชื่อหนังสือ')}</h3>
      <div class="meta">${escapeHTML((b.author_name || ['ไม่ทราบผู้แต่ง']).slice(0, 2).join(', '))} · ${b.first_publish_year || 'ไม่ระบุปี'}</div>
      <div class="edition-badge">📖 ${b.edition_count || 1} Editions</div>
      <div class="tags">${tags.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}</div>
      <div class="actions">
        <button data-act="cmp">เปรียบเทียบ</button>
      </div>
    `;

    div.querySelector('[data-act="cmp"]').onclick = (e) => { e.stopPropagation(); toggleCompare(b, div); };
    div.querySelector('h3').onclick = () => openDetail(b);
    const img = div.querySelector('img'); if (img) img.onclick = () => openDetail(b);
    div.addEventListener('click', () => { recentStack.push(b); renderStack(); });

    grid.appendChild(div);
  });
}

/* ==========================================================================
   Pagination Events ( try...catch )
   ========================================================================== */
document.getElementById('prevPageBtn').onclick = async () => {
  if (currentPage > 1) {
    await runSearch(currentQuery, currentPage - 1);
  }
};

document.getElementById('nextPageBtn').onclick = async () => {
  if (currentPage * 18 < totalResults) {
    await runSearch(currentQuery, currentPage + 1);
  }
};

loadmoreBtn.onclick = async () => {
  if (!fetchQueue.size) return;
  const nextPage = fetchQueue.dequeue();
  loadmoreBtn.textContent = 'กำลังโหลด...';
  try {
    const data = await fetchFromExpress(currentQuery, nextPage);
    const docs = data.docs || [];
    docs.forEach(d => {
      titleTrie.insert(d.title || '');
      bookCache.set(d.key, d);
    });
    currentBooks = currentBooks.concat(docs);
    loadmoreBtn.textContent = 'โหลดเพิ่มในหน้านี้ (Queue)';
    if (currentBooks.length < totalResults) fetchQueue.enqueue(nextPage + 1);
    loadmoreBtn.style.display = fetchQueue.size ? 'inline-block' : 'none';
    renderGrid();
  } catch (error) {
    alert('ไม่สามารถโหลดข้อมูลเพิ่มได้: ' + error.message);
    loadmoreBtn.textContent = 'ลองอีกครั้ง';
  }
};

/* ==========================================================================
   Recently Viewed (Stack UI)
   ========================================================================== */
function renderStack() {
  const el = document.getElementById('stackList');
  if (!recentStack.items.length) { el.innerHTML = '<div class="empty">ยังไม่มีรายการ</div>'; return; }
  el.innerHTML = recentStack.items.map((b, i) => `
    <div class="stack-item" data-idx="${i}" role="button" tabindex="0">
      <b>${escapeHTML(b.title)}</b>
      <span>📖 ${b.edition_count || 1} Editions</span>
    </div>
  `).join('');

  // ผูกคลิก/กด Enter ให้เปิด modal เหมือนคลิกการ์ดในกริดปกติ
  [...el.children].forEach((node, i) => {
    const book = recentStack.items[i];
    const open = () => { recentStack.push(book); renderStack(); openDetail(book); };
    node.addEventListener('click', open);
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
}

/* ==========================================================================
   Compare (Set Intersection)
   ========================================================================== */
function toggleCompare(book, cardEl) {
  const btn = cardEl.querySelector('[data-act="cmp"]');
  if (compareMap.has(book.key)) {
    compareMap.delete(book.key);
    btn.classList.remove('active');
  } else {
    if (compareMap.size >= 3) { alert('เปรียบเทียบได้สูงสุด 3 เล่ม'); return; }
    compareMap.set(book.key, book);
    btn.classList.add('active');
  }
  renderCompare();
}

function renderCompare() {
  const el = document.getElementById('cmpList');
  const shared = document.getElementById('shared');
  const items = [...compareMap.values()];

  if (!items.length) {
    el.innerHTML = '<div class="empty">กด "เปรียบเทียบ" ที่การ์ดหนังสือ</div>';
    shared.innerHTML = '';
    return;
  }

  el.innerHTML = items.map(b => `
    <div class="cmp-item">
      <b>${escapeHTML(b.title)}</b>
      ${b.first_publish_year || '-'} · 📖 ${b.edition_count || 1} Editions
    </div>
  `).join('');

  if (items.length >= 2) {
    const sets = items.map(b => new Set((b.subject || []).map(s => s.toLowerCase())));
    let inter = sets[0];
    for (let i = 1; i < sets.length; i++) {
      inter = new Set([...inter].filter(x => sets[i].has(x)));
    }
    shared.innerHTML = inter.size
      ? `<div class="shared"><b>หมวดหมู่ร่วมกัน (Set Intersection):</b> ${[...inter].slice(0, 5).map(s => escapeHTML(s)).join(', ')}</div>`
      : `<div class="shared">ไม่มีหมวดหมู่ร่วมกัน</div>`;
  } else { shared.innerHTML = ''; }
}

/* ==========================================================================
   Detail Modal (Express API)
   ========================================================================== */
const modalBg = document.getElementById('modalBg');
const modalBody = document.getElementById('modalBody');

async function openDetail(book) {
  modalBg.classList.add('open');
  modalBody.innerHTML = '<p>กำลังโหลดรายละเอียดจาก Server...</p>';
  
  try {
    const res = await fetch(`/api/work?key=${encodeURIComponent(book.key)}`);
    if (!res.ok) throw new Error('Fetch detail failed');
    const data = await res.json();
    
    let desc = data.description || 'ไม่มีคำอธิบายในระบบ';
    if (typeof desc === 'object') desc = desc.value || 'ไม่มีคำอธิบายในระบบ';

    const cover = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : '';

    modalBody.innerHTML = `
      ${cover ? `<img src="${cover}" style="width:110px;float:left;margin:0 14px 10px 0;border-radius:3px">` : ''}
      <h2 class="serif">${escapeHTML(book.title)}</h2>
      <div class="meta">${escapeHTML((book.author_name || []).join(', '))} · ปีพิมพ์ ${book.first_publish_year || '-'}</div>
      <div style="margin:6px 0;color:var(--accent);font-weight:bold;">📖 ${book.edition_count || 1} Editions</div>
      <p style="clear:both">${escapeHTML(desc)}</p>
      <div class="tags">${(book.subject || []).slice(0, 6).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}</div>
    `;
  } catch (e) {
    modalBody.innerHTML = `<h2 class="serif">${escapeHTML(book.title)}</h2><p>❌ ไม่สามารถโหลดรายละเอียดเพิ่มเติมได้</p>`;
  }
}

document.getElementById('modalClose').onclick = () => modalBg.classList.remove('open');
modalBg.onclick = (e) => { if (e.target === modalBg) modalBg.classList.remove('open'); };

/* ==========================================================================
   Binary Search Button Event
   ========================================================================== */
document.getElementById('jumpBtn').onclick = () => {
  const target = parseInt(document.getElementById('yearJump').value, 10);
  if (isNaN(target) || !currentBooks.length) { alert('กรุณากรอกปีเป็นตัวเลข และค้นหาหนังสือก่อน'); return; }

  // ต้องเรียงข้อมูลก่อนใช้ Binary Search
  currentBooks = mergeSort([...currentBooks], (a, b) => (a.first_publish_year || 9999) - (b.first_publish_year || 9999));
  document.getElementById('sortSel').value = 'year_asc';
  
  const idx = binarySearchClosestYear(currentBooks, target);
  renderGrid();

  const cards = grid.children;
  if (cards[idx]) {
    cards[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    cards[idx].style.outline = '3px solid var(--accent)';
    setTimeout(() => cards[idx].style.outline = '', 2000);
  }
};

/* ==========================================================================
   Random Surprise (Fisher-Yates Shuffle)
   ========================================================================== */
document.getElementById('surprise').onclick = async () => {
  const pickedSeed = pickRandomSeed();
  const randomPage = Math.floor(Math.random() * 5) + 1; // สุ่มหน้า 1–5 กันได้ผลลัพธ์เดิมซ้ำทุกครั้ง
  qInput.value = pickedSeed;
  await runSearch(pickedSeed, randomPage);
};

/* ==========================================================================
   Autocomplete (Trie)
   ========================================================================== */
qInput.addEventListener('input', () => {
  const val = qInput.value.trim();
  if (val.length < 2) { suggestBox.style.display = 'none'; return; }
  const matches = titleTrie.wordsWithPrefix(val);
  if (!matches.length) { suggestBox.style.display = 'none'; return; }

  suggestBox.innerHTML = matches.map(m => `<div>${escapeHTML(m)}</div>`).join('');
  suggestBox.style.display = 'block';

  [...suggestBox.children].forEach((c, i) => {
    c.onclick = () => {
      qInput.value = matches[i];
      suggestBox.style.display = 'none';
      runSearch(matches[i], 1);
    };
  });
});

document.addEventListener('click', (e) => { if (e.target !== qInput) suggestBox.style.display = 'none'; });
document.getElementById('go').onclick = () => { const v = qInput.value.trim(); if (v) runSearch(v, 1); };
qInput.addEventListener('keydown', e => { if (e.key === 'Enter') { suggestBox.style.display = 'none'; const v = qInput.value.trim(); if (v) runSearch(v, 1); } });

/* Theme Toggle */
const themeBtn = document.getElementById('themeBtn');
function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
  themeBtn.textContent = dark ? '☀️ โหมดสว่าง' : '🌙 โหมดมืด';
  try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
}
themeBtn.onclick = () => applyTheme(!document.body.classList.contains('dark'));
try { applyTheme(localStorage.getItem('theme') === 'dark'); } catch (e) {}

// ค้นหาเริ่มต้นเมื่อเปิดหน้าเว็บ — สุ่มคำค้นหาและสุ่มหน้า แทนที่จะ hardcode 'Harry Potter'
(function loadInitialRandomBooks() {
  const seed = pickRandomSeed();
  const randomPage = Math.floor(Math.random() * 5) + 1;
  qInput.value = seed;
  runSearch(seed, randomPage);
})();
