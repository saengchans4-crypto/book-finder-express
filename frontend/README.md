# Book Finder — Open Library Explorer (React + React Router)

Final project ต่อยอดจากเว็บค้นหาหนังสือ ใช้ [Open Library API](https://openlibrary.org/developers/api)
สร้างด้วย **React + Vite + React Router** และใช้ **Graph** เป็นแกนของระบบ Navigation

## รัน
```
npm install
npm run dev   # http://localhost:5173
npm test      # ตรวจ graph.js และ dsa.js (node --test)
```
Deploy: push ขึ้น GitHub แล้ว Import ที่ Vercel (Framework = Vite) — `vercel.json` ตั้ง rewrite ให้ BrowserRouter รีเฟรชหน้าย่อยได้

## โครงสร้าง
| ไฟล์ | หน้าที่ |
|---|---|
| `src/graph.js` | `pageGraph` (directed adjacency list), `canReach` (BFS), `checkGraph`, กราฟหนังสือ + `shortestPath` |
| `src/dsa.js` | Trie, Merge Sort, Queue, Stack (pushRecent), Binary Search, Fisher–Yates, Set intersection |
| `src/App.jsx` | `BrowserRouter` + `Routes`; NavBar สร้าง `<Link>` จาก `pageGraph[current]` |
| `src/AppContext.jsx` | state กลาง (ผลค้นหา, ดูล่าสุด, รายการเปรียบเทียบ) |
| `src/pages/*` | Home, Compare, History, About (แสดง graph), BookPage (`/book/:id`), NotFound |

## Graph ในโปรเจกต์
1. **Graph ของหน้าเว็บ (directed):** node = หน้า, edge = `<Link>` บน NavBar → BFS ตรวจ orphans/deadEnds
2. **Graph ของหนังสือ (undirected):** node = หนังสือ/ผู้แต่ง/หมวดหมู่ → BFS หาเส้นทางสั้นสุดระหว่างหนังสือ 2 เล่ม (หน้า Compare)

## React Router เปลี่ยน URL โดยไม่ reload ได้อย่างไร
`<Link>` ไม่ได้ให้ browser โหลดไฟล์ HTML ใหม่ แต่เรียก History API (`pushState`) เปลี่ยน URL แล้ว
`<Routes>` อ่าน URL ใหม่และสลับ component ที่ตรงกับ `<Route path>` ให้เอง ทำให้ state (เช่น ผลค้นหา) ไม่หาย
ถ้าใช้ `<a href>` browser จะโหลดหน้าใหม่ทั้งหมดและ state รีเซ็ต

## เอกสารประกอบการนำเสนอ
อ่าน `REACT_EXPLAINED.md` — อธิบาย React, component tree, React Router และคำถาม DSA ที่น่าจะโดนถาม
