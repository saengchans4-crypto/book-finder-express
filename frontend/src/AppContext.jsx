import { createContext, useContext, useRef, useState } from 'react';
import { searchBooks } from './api';
import { Trie, Queue, pushRecent } from './dsa';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const trie = useRef(new Trie());
  const index = useRef(new Map());   // key -> book (hash map ไว้ค้นเร็ว)
  const pages = useRef(new Queue()); // คิว offset ที่ยังไม่โหลด
  const reqId = useRef(0);           // เลขคำขอล่าสุด กันผลของคำค้นเก่ามาทับผลใหม่
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [hasMore, setHasMore] = useState(false);
  const [recent, setRecent] = useState([]);
  const [compare, setCompare] = useState([]);

  const ingest = (docs) => docs.forEach((d) => { trie.current.insert(d.title || ''); index.current.set(d.key, d); });

  const run = async (q) => {
    const id = ++reqId.current;
    setQuery(q); setStatus('loading'); setBooks([]);
    pages.current = new Queue();
    try {
      const data = await searchBooks(q, 0);
      if (id !== reqId.current) return; // มีการค้นใหม่แล้ว ทิ้งผลเก่า
      const docs = data.docs || [];
      ingest(docs);
      setBooks(docs);
      setTotal(data.numFound || docs.length);
      for (let off = 18; off < Math.min(data.numFound || 0, 90); off += 18) pages.current.enqueue(off);
      setHasMore(pages.current.size > 0);
      setStatus('ready');
    } catch { if (id === reqId.current) setStatus('error'); }
  };

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
    } catch { setStatus('error'); }
  };

  const value = {
    query, books, total, status, hasMore, recent, compare,
    run, more,
    suggest: (p) => trie.current.startsWith(p),
    findBook: (id) => index.current.get('/works/' + id),
    view: (b) => setRecent((r) => pushRecent(r, b, 8)),
    toggleCompare: (b) => setCompare((c) =>
      c.some((x) => x.key === b.key) ? c.filter((x) => x.key !== b.key) : c.length >= 3 ? c : [...c, b]),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}