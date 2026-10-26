import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { coverUrl, workId } from '../api';

function coverHue(title) {
  let h = 0;
  const s = String(title || '');
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) % 360;
  }
  return h;
}

export default function BookCard({ book, highlight }) {
  const { compare, toggleCompare, view } = useApp();
  const location = useLocation();
  const picked = compare.some((x) => x.key === book.key);
  const id = workId(book.key);
  const n = book.edition_count || 0;
  return (
    <div id={'bk-' + id} className={'card' + (highlight ? ' hl' : '')} style={{ '--h': coverHue(book.title) }}>
      <Link to={`/book/${id}`} state={{ background: location }} onClick={() => view(book)}>
        {book.cover_i ? <img src={coverUrl(book.cover_i)} alt="" loading="lazy" /> : <div className="nocover" style={{ '--h': coverHue(book.title) }}><span>{book.title}</span></div>}
        <h3>{book.title}</h3>
      </Link>
      <div className="meta">{(book.author_name || ['ไม่ทราบผู้แต่ง']).slice(0, 2).join(', ')} · {book.first_publish_year || '-'}</div>
      {n > 0 && <span className="pill-ed">{n} edition{n > 1 ? 's' : ''}</span>}
      <div className="tags">
        {(book.subject || []).slice(0, 2).map((t) => <span className="tag" key={t}>{t}</span>)}
      </div>
      <button className={'btn block' + (picked ? ' active' : '')} onClick={() => toggleCompare(book)}>
        {picked ? '✓ เลือกเปรียบเทียบแล้ว' : 'เปรียบเทียบ'}
      </button>
    </div>
  );
}