import { Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { coverUrl, workId } from '../api';

export default function BookCard({ book, highlight }) {
  const { compare, toggleCompare, view } = useApp();
  const picked = compare.some((x) => x.key === book.key);
  const id = workId(book.key);
  return (
    <div id={'bk-' + id} className={'card' + (highlight ? ' hl' : '')}>
      {book.cover_i ? <img src={coverUrl(book.cover_i)} alt="" loading="lazy" /> : <div className="nocover">ไม่มีปก</div>}
      <Link to={`/book/${id}`} onClick={() => view(book)}>
        <h3 className="serif">{book.title}</h3>
      </Link>
      <div className="meta">{(book.author_name || ['ไม่ทราบผู้แต่ง']).slice(0, 2).join(', ')} · {book.first_publish_year || '-'} · {book.edition_count || 0} edition</div>
      <div className="tags">
        {(book.subject || []).slice(0, 3).map((t) => <span className="tag" key={t}>{t}</span>)}
      </div>
      <button className={'btn small' + (picked ? ' active' : '')} onClick={() => toggleCompare(book)}>
        {picked ? '✓ เลือกเปรียบเทียบแล้ว' : 'เปรียบเทียบ'}
      </button>
    </div>
  );
}
