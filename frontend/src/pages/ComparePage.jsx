import { useMemo } from 'react';
import { useApp } from '../AppContext';
import { intersectAll } from '../dsa';
import { buildBookGraph, shortestPath } from '../graph';

export default function ComparePage() {
  const { compare, books, toggleCompare } = useApp();

  const shared = intersectAll(compare.map((b) => (b.subject || []).map((s) => s.toLowerCase())));

  // Graph #2: รวมหนังสือผลลัพธ์ + ที่เลือก แล้วหาเส้นทางสั้นสุดด้วย BFS
  const graph = useMemo(() => {
    const all = [...books];
    compare.forEach((c) => { if (!all.some((b) => b.key === c.key)) all.push(c); });
    return buildBookGraph(all);
  }, [books, compare]);

  const path = compare.length >= 2 ? shortestPath(graph, 'book:' + compare[0].key, 'book:' + compare[1].key) : null;
  const title = (k) => (books.concat(compare).find((b) => b.key === k) || {}).title || k;
  const label = (n) => {
    if (n.startsWith('book:')) return '📖 ' + title(n.slice(5));
    if (n.startsWith('author:')) return '✍️ ' + n.slice(7);
    return '🏷️ ' + n.slice(8);
  };

  return (
    <section>
      <h2 className="serif">เปรียบเทียบหนังสือ</h2>
      {!compare.length && <p className="empty">ยังไม่ได้เลือก — กลับไปหน้าหลักแล้วกด "เปรียบเทียบ" ที่การ์ด (สูงสุด 3 เล่ม)</p>}
      <div className="cols">
        {compare.map((b) => (
          <div className="panel" key={b.key}>
            <b>{b.title}</b>
            <div className="meta">{(b.author_name || []).join(', ')} · {b.first_publish_year || '-'}</div>
            <button className="btn small" onClick={() => toggleCompare(b)}>เอาออก</button>
          </div>
        ))}
      </div>

      {compare.length >= 2 && (
        <>
          <div className="panel">
            <h3>หมวดหมู่ร่วมกัน <small>(Set Intersection)</small></h3>
            {shared.length ? <div className="tags">{shared.slice(0, 12).map((s) => <span className="tag" key={s}>{s}</span>)}</div> : <p className="empty">ไม่มีหมวดหมู่ร่วมกัน</p>}
          </div>
          <div className="panel">
            <h3>เส้นทางเชื่อมโยง <small>(Graph + BFS หาเส้นทางสั้นสุด)</small></h3>
            {path
              ? <ol className="path">{path.map((n) => <li key={n}>{label(n)}</li>)}</ol>
              : <p className="empty">ไม่พบเส้นทางเชื่อมโยงในกราฟของผลลัพธ์ที่โหลดมา</p>}
          </div>
        </>
      )}
    </section>
  );
}
