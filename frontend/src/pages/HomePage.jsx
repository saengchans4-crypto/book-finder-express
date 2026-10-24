import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import BookCard from '../components/BookCard';
import { mergeSort, binarySearchClosest, shuffle } from '../dsa';
import { searchBooks, workId } from '../api';

const yearAsc = (b) => b.first_publish_year || 9999;
const SEEDS = ['love', 'war', 'space', 'mystery', 'ocean', 'dream', 'city', 'magic', 'journey', 'science'];

export default function HomePage() {
  const { query, books, total, status, hasMore, run, more, suggest } = useApp();
  const nav = useNavigate();
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

  const surprise = async () => {
    try {
      const data = await searchBooks(shuffle(SEEDS)[0]);   // Fisher–Yates เลือกคำ
      const pick = shuffle(data.docs || [])[0];            // Fisher–Yates เลือกเล่ม
      if (pick) nav(`/book/${workId(pick.key)}`);
    } catch { /* ignore */ }
  };

  return (
    <section>
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
        <button className="btn primary" onClick={() => submit(text)}>ค้นหา</button>
        <button className="btn" onClick={surprise}>🎲 สุ่มให้หน่อย</button>
      </div>

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
        <label>กระโดดไปปี (Binary Search)
          <input type="number" value={year} placeholder="เช่น 1995" style={{ width: 90 }} onChange={(e) => setYear(e.target.value)} />
          <button className="btn small" onClick={jump}>ไป</button>
        </label>
        <span className="status">
          {status === 'loading' && 'กำลังค้นหา...'}
          {status === 'error' && 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง'}
          {status === 'ready' && `พบ ${total.toLocaleString()} รายการ (แสดง ${books.length})`}
        </span>
      </div>

      <div className="grid">
        {sorted.map((b) => <BookCard key={b.key} book={b} highlight={hl === b.key} />)}
      </div>
      {hasMore && <button className="btn loadmore" onClick={more}>โหลดเพิ่ม</button>}
    </section>
  );
}
