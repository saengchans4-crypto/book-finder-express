import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import BookCard from '../components/BookCard';
import { mergeSort, binarySearchClosest, shuffle } from '../dsa';
import { workId } from '../api';
import { buildBookGraph, relatedBooks } from '../graph';
const yearAsc = (b) => b.first_publish_year || 9999;
const SEEDS = ['love', 'war', 'space', 'mystery', 'ocean', 'dream', 'city', 'magic', 'journey', 'science'];

export default function HomePage() {
  const { query, books, total, status, hasMore, page, lastPage, pageCount, run, more, goToPage, suggest, recent, compare, toggleCompare } = useApp();
  const location = useLocation();
  const [text, setText] = useState(query);
  const [sug, setSug] = useState([]);
  const [sort, setSort] = useState('relevance');
  const [year, setYear] = useState('');
  const [hl, setHl] = useState(null);

  useEffect(() => { if (status === 'idle') run(shuffle(SEEDS)[0]); }, []);
  useEffect(() => { setText(query); }, [query]);
  useEffect(() => {
    if (hl) document.getElementById('bk-' + workId(hl))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [hl]);

  const sorted = useMemo(() => {
    if (sort === 'edition_desc') return mergeSort(books, (a, b) => (b.edition_count || 0) - (a.edition_count || 0));
    if (sort === 'edition_asc') return mergeSort(books, (a, b) => (a.edition_count || 0) - (b.edition_count || 0));
    if (sort === 'year_desc') return mergeSort(books, (a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0));
    if (sort === 'year_asc') return mergeSort(books, (a, b) => yearAsc(a) - yearAsc(b));
    if (sort === 'title') return mergeSort(books, (a, b) => (a.title || '').localeCompare(b.title || ''));
    return books;
  }, [books, sort]);

    // หนังสือที่เกี่ยวข้องกับเล่มที่เปิดดูล่าสุด (Graph BFS ผ่านผู้แต่ง/หมวดหมู่)
  const base = recent[0];
  const related = useMemo(() => {
    if (!base) return [];
    const g = buildBookGraph([base, ...books]);
    const byKey = new Map(books.map((b) => [b.key, b]));
    return relatedBooks(g, base.key, 5).map((k) => byKey.get(k)).filter(Boolean);
  }, [base, books]);

  const onType = (v) => { setText(v); setSug(v.trim().length >= 2 ? suggest(v.trim()) : []); };
  const submit = (q) => { const v = q.trim(); if (v) { setSug([]); run(v); } };

  const jump = () => {
    const t = parseInt(year, 10);
    if (isNaN(t) || !books.length) return;
    const asc = mergeSort(books, (a, b) => yearAsc(a) - yearAsc(b)); // ต้องเรียงก่อนจึงใช้ Binary Search ได้
    const i = binarySearchClosest(asc, t, yearAsc);
    setSort('year_asc');
    setHl(asc[i].key);
    setTimeout(() => setHl(null), 2200);
  };

  // สุ่มหมวดใหม่ (Fisher–Yates) ที่ไม่ซ้ำหมวดเดิม แล้วแสดงรายการทั้งหมดของหมวดนั้น
  const reroll = () => {
    const pool = SEEDS.filter((s) => s !== query);
    run(shuffle(pool)[0]);
  };

  // เปลี่ยนหน้าแล้วเลื่อนกลับขึ้นบน
  const goTo = (p) => { goToPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <section>
      <div className="hero">
        <h1>Book Finder</h1>
        <p>ค้นหาและจัดเรียงหนังสือจาก Open Library</p>
      </div>

      <div className="searchbar">
        <div className="sbox">
          <input value={text} placeholder="ค้นหาชื่อหนังสือหรือผู้แต่ง..." onChange={(e) => onType(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && submit(text)} />
          {sug.length > 0 && (
            <div className="suggest">
              {sug.map((s) => <div key={s} onClick={() => { setText(s); submit(s); }}>{s}</div>)}
            </div>
          )}
        </div>
        <button className="btn primary big" onClick={() => submit(text)}>ค้นหา</button>
        <button className="btn soft big" onClick={reroll} disabled={status === 'loading'}>
          {status === 'loading' ? 'กำลังโหลด...' : '🎲 สุ่มหนังสือ'}
        </button>
      </div>

      <div className="layout">
        <div className="results">
          <div className="toolbar">
            <label>เรียงตาม
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="relevance">ความเกี่ยวข้อง</option>
                <option value="edition_desc">จำนวน Edition มากสุด</option>
                <option value="edition_asc">จำนวน Edition น้อยสุด</option>
                <option value="year_desc">ปีล่าสุดก่อน</option>
                <option value="year_asc">ปีเก่าสุดก่อน</option>
                <option value="title">ชื่อ A–Z</option>
              </select>
            </label>
            <label>กระโดดไปปี
              <input type="number" value={year} placeholder="เช่น 1995" style={{ width: 90 }} onChange={(e) => setYear(e.target.value)} />
              <button className="btn small" onClick={jump}>ไป</button>
            </label>
            <span className="status">
              {status === 'loading' && 'กำลังค้นหา...'}
              {status === 'ready' && `พบทั้งหมด ${total.toLocaleString()} รายการ (แสดง ${books.length})`}
            </span>
          </div>

          <div className="grid">
            {status === 'loading' && books.length === 0 &&
              Array.from({ length: 8 }, (_, i) => <div className="skel" key={i} />)}
            {sorted.map((b) => <BookCard key={b.key} book={b} highlight={hl === b.key} />)}
          </div>

          {status === 'ready' && books.length === 0 && (
            <p className="empty">ไม่พบหนังสือที่ตรงกับ "{query}" ลองใช้คำอื่น หรือกด 🎲 สุ่มหนังสือ</p>
          )}
          {status === 'error' && (
            <p className="empty">
              เชื่อมต่อไม่สำเร็จ{' '}
              <button className="btn small" onClick={() => run(query || shuffle(SEEDS)[0], page)}>ลองใหม่</button>
            </p>
          )}

          {pageCount > 1 && (
            <div className="pager">
              <button className="btn" disabled={page <= 1 || status === 'loading'} onClick={() => goTo(page - 1)}>‹ ก่อนหน้า</button>
              <span className="pager-info">หน้า {page === lastPage ? page : `${page}–${lastPage}`} / {pageCount}</span>
              <button className="btn primary" disabled={lastPage >= pageCount || status === 'loading'} onClick={() => goTo(lastPage + 1)}>ถัดไป ›</button>
            </div>
          )}
          {hasMore && <button className="btn loadmore" onClick={more}>โหลดเพิ่มในหน้านี้</button>}
        </div>

        <aside className="rail">
          <div className="panel">
            <h3>ดูล่าสุด</h3>
            <p className="rail-sub">เก็บ 8 รายการล่าสุดที่เปิดดู</p>
            {recent.length === 0 && <p className="empty">ยังไม่มีรายการ</p>}
            <ul className="rail-list">
              {recent.map((b) => (
                <li key={b.key}>
                  <Link to={`/book/${workId(b.key)}`} state={{ background: location }}>{b.title}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h3>เปรียบเทียบ</h3>
            <p className="rail-sub">เลือกได้สูงสุด 3 เล่ม</p>
            {compare.length === 0 && <p className="empty">กด "เปรียบเทียบ" ที่การ์ดหนังสือ</p>}
            <ul className="rail-list">
              {compare.map((b) => (
                <li key={b.key}>
                  <Link className="booklink" to={`/book/${workId(b.key)}`} state={{ background: location }}>{b.title}</Link>
                  <button className="x" onClick={() => toggleCompare(b)} aria-label="เอาออก">✕</button>
                </li>
              ))}
            </ul>
            {compare.length >= 2 && <Link className="btn small" to="/compare">ดูผลเปรียบเทียบ</Link>}
          </div>
                  <div className="panel">
            <h3>หนังสือที่เกี่ยวข้อง</h3>
            <p className="rail-sub">Graph BFS ผ่านผู้แต่ง/หมวดหมู่ของเล่มที่เปิดล่าสุด</p>
            {!base && <p className="empty">เปิดดูหนังสือสักเล่มก่อน</p>}
            {base && related.length === 0 && <p className="empty">ไม่พบเล่มที่เชื่อมโยงในผลที่โหลดอยู่</p>}
            <ul className="rail-list">
              {related.map((b) => (
                <li key={b.key}>
                  <Link className="booklink" to={`/book/${workId(b.key)}`} state={{ background: location }}>
                    {b.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          </aside>
      </div>
    </section>
  );
}
