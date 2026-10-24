import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import { getWork, coverUrl } from '../api';

export default function BookPage() {
  const { id } = useParams();
  const { findBook, view } = useApp();
  const book = findBook(id);
  const [work, setWork] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    setWork(null); setErr(false);
    if (book) view(book);
    getWork(id)
      .then((w) => { setWork(w); if (!book) view({ key: `/works/${id}`, title: w.title }); })
      .catch(() => setErr(true));
  }, [id]);

  if (err) return <p className="empty">โหลดรายละเอียดไม่สำเร็จ</p>;
  if (!work) return <p className="empty">กำลังโหลดรายละเอียด...</p>;
  const desc = typeof work.description === 'object' ? work.description?.value : work.description;
  const cover = book?.cover_i || work.covers?.[0];

  return (
    <article className="detail">
      {cover && <img src={coverUrl(cover, 'L')} alt="" />}
      <div>
        <h2 className="serif">{work.title}</h2>
        {book && <div className="meta">{(book.author_name || []).join(', ')} · {book.first_publish_year || '-'}</div>}
        <p>{desc || 'ไม่มีคำอธิบายในระบบ'}</p>
        <div className="tags">{(work.subjects || book?.subject || []).slice(0, 10).map((t) => <span className="tag" key={t}>{t}</span>)}</div>
      </div>
    </article>
  );
}
