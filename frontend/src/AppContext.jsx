import { createContext, useContext, useRef, useState } from 'react';
import { searchBooks } from './api';
import { Trie, Queue, pushRecent } from './dsa';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const LIMIT = 18;    // ต้องตรงกับ LIMIT ใน api.js
const MAX_PAGE = 50; // ต้องตรงกับ validate ใน server.js (page 1-50)

export function AppProvider({ children }) {
  const trie = useRef(new Trie());
  const index = useRef(new Map());   // key -> book (hash map ไว้ค้นเร็ว)
  const pages = useRef(new Queue()); // คิว offset ที่ยังไม่โหลด (ของ "โหลดเพิ่มในหน้านี้")
  const reqId = useRef(0);           // เลขคำขอล่าสุด กันผลของคำค้นเก่ามาทับผลใหม่
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);          // หน้าแรกของชุดผลลัพธ์ที่แสดงอยู่
  const [lastPage, setLastPage] = useState(1);  // หน้าสุดท้ายที่โหลดมาแสดง (เพิ่มได้ด้วย "โหลดเพิ่ม")
  const [pageCount, setPageCount] = useState(0); // จำนวนหน้าทั้งหมด
  const [recent, setRecent] = useState([]);
  const [compare, setCompare] = useState([]);

  const ingest = (docs) => docs.forEach((d) => { trie.current.insert(d.title || ''); index.current.set(d.key, d); });

  // ค้นหาหน้าที่ p (ค่าเริ่มต้นคือหน้า 1) แล้วแทนที่รายการเดิม
  const run = async (q, p = 1) => {
    const id = ++reqId.current;
    setQuery(q); setStatus('loading'); setBooks([]);
    setPageCount(0); setHasMore(false);
    pages.current = new Queue();
    try {
      const data = await searchBooks(q, (p - 1) * LIMIT);
      if (id !== reqId.current) return; // มีการค้นใหม่แล้ว ทิ้งผลเก่า
      const docs = data.docs || [];
      const count = Math.min(MAX_PAGE, Math.ceil((data.numFound || 0) / LIMIT));
      ingest(docs);
      setBooks(docs);
      setTotal(data.numFound || docs.length);
      setPage(p); setLastPage(p); setPageCount(count);
      // ใส่ offset ของอีกไม่เกิน 4 หน้าถัดไปเข้าคิว ไว้ให้ปุ่ม "โหลดเพิ่มในหน้านี้"
      for (let n = p + 1; n <= Math.min(count, p + 4); n++) pages.current.enqueue((n - 1) * LIMIT);
      setHasMore(pages.current.size > 0);
      setStatus('ready');
    } catch { if (id === reqId.current) setStatus('error'); }
  };

  // ดึง offset ถัดไปจากหัวคิว (FIFO) แล้วต่อท้ายรายการเดิม
  const more = async () => {
    if (!pages.current.size) return;
    const id = reqId.current;
    const off = pages.current.dequeue();
    setHasMore(pages.current.size > 0);
    try {
      const data = await searchBooks(query, off);
      if (id !== reqId.current) return; // ระหว่างโหลดเพิ่มมีการค้นใหม่ ทิ้งผลเก่า
      const docs = data.docs || [];
      ingest(docs);
      setBooks((b) => [...b, ...docs]);
      setLastPage((l) => Math.max(l, off / LIMIT + 1));
    } catch { setStatus('error'); }
  };

  const goToPage = (p) => { if (p >= 1 && p <= pageCount) run(query, p); };

  const value = {
    query, books, total, status, hasMore, page, lastPage, pageCount, recent, compare,
    run, more, goToPage,
    suggest: (p) => trie.current.startsWith(p),
    findBook: (id) => index.current.get('/works/' + id),
    view: (b) => setRecent((r) => pushRecent(r, b, 8)),
    toggleCompare: (b) => setCompare((c) =>
      c.some((x) => x.key === b.key) ? c.filter((x) => x.key !== b.key) : c.length >= 3 ? c : [...c, b]),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
