import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import { getWork, coverUrl } from '../api';

export default function BookPage({ modal = false }) {
  const { id } = useParams();
  const nav = useNavigate();
  const { findBook, view } = useApp();
  const book = findBook(id);
  const [work, setWork] = useState(null);
  const [err, setErr] = useState(false);

  const close = () => nav(-1);

  useEffect(() => {
    setWork(null); setErr(false);
    if (book) view(book);
    getWork(id)
      .then((w) => { setWork(w); if (!book) view({ key: `/works/${id}`, title: w.title }); })
      .catch(() => setErr(true));
  }, [id]);

  // โหมดหน้าต่าง: กด Esc เพื่อปิด และล็อกการเลื่อนของหน้าด้านหลัง
  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [modal]);

  let content;
  if (err) {
    content = <p className="empty">โหลดรายละเอียดไม่สำเร็จ</p>;
  } else if (!work) {
    content = <p className="empty">กำลังโหลดรายละเอียด...</p>;
  } else {
    const desc = typeof work.description === 'object' ? work.description?.value : work.description;
    const cover = book?.cover_i || work.covers?.[0];
    content = (
      <article className="detail">
        {cover && <img src={coverUrl(cover, 'L')} alt="" />}
        <div>
          <h2>{work.title}</h2>
          {book && <div className="meta">{(book.author_name || []).join(', ')} · {book.first_publish_year || '-'}</div>}
          <p className="desc">{desc || 'ไม่มีคำอธิบายในระบบ'}</p>
          <div className="tags">{(work.subjects || book?.subject || []).slice(0, 8).map((t) => <span className="tag" key={t}>{t}</span>)}</div>
          <a className="btn small ext" href={`https://openlibrary.org/works/${id}`} target="_blank" rel="noreferrer">ดูบน Open Library ↗</a>
        </div>
      </article>
    );
  }

  if (!modal) {
    return (
      <div className="page-detail">
        <Link className="back" to="/">← กลับหน้าหลัก</Link>
        {content}
      </div>
    );
  }
  return (
    <div className="modal-bg" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close} aria-label="ปิด">✕</button>
        {content}
      </div>
    </div>
  );
}