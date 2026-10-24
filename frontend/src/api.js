// ติดต่อ Express backend (Express เป็นคนไปเรียก Open Library อีกที)
const LIMIT = 18;

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('API error');
  return r.json();
}

export function searchBooks(q, offset = 0) {
  const page = Math.floor(offset / LIMIT) + 1;
  return getJson(`/api/search?q=${encodeURIComponent(q)}&page=${page}&limit=${LIMIT}`);
}

export function getWork(id) {
  return getJson(`/api/work?key=${encodeURIComponent('/works/' + id)}`);
}

export const coverUrl = (id, size = 'M') => (id ? `https://covers.openlibrary.org/b/id/${id}-${size}.jpg` : '');
export const workId = (key) => key.split('/').pop(); // "/works/OL123W" -> "OL123W"