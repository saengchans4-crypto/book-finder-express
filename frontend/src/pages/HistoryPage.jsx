import { Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { workId } from '../api';

export default function HistoryPage() {
  const { recent } = useApp();
  return (
    <section>
      <h2 className="serif">ดูล่าสุด <small>(Stack — LIFO, เก็บ 8 รายการ)</small></h2>
      {!recent.length && <p className="empty">ยังไม่มีรายการ</p>}
      {recent.map((b) => (
        <div className="panel" key={b.key}>
          <Link to={`/book/${workId(b.key)}`}><b>{b.title}</b></Link>
          <div className="meta">{(b.author_name || [])[0] || ''}</div>
        </div>
      ))}
    </section>
  );
}
