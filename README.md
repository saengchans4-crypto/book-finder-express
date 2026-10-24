# Stacks — Book Finder (React + Vite + Express)

งานต่อยอด API วิชา 801201 · ใช้ [Open Library API](https://openlibrary.org/developers/api)
Frontend: React + Vite + React Router · Backend: Express (proxy + validate + cache)

## วิธีรัน

เปิด Terminal 2 หน้าต่าง

```bash
# หน้าต่าง 1: backend (http://localhost:3000)
cd backend
npm install
npm run dev

# หน้าต่าง 2: frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
npm test      # ตรวจ graph.js และ dsa.js
```

Vite ตั้ง proxy ให้ `/api` ไปที่ Express (`frontend/vite.config.js`) จึงเปิดใช้งานที่ `http://localhost:5173`

## โครงสร้าง

```
book-finder-express/
├── backend/            Express: /api/search, /api/work
│   └── server.js       validate, TTL cache (Custom Hash Table), timeout, จัดการ error
├── frontend/           React + Vite
│   └── src/
│       ├── App.jsx            BrowserRouter, Routes, NavBar (สร้างจาก Graph)
│       ├── AppContext.jsx     state กลาง: ผลค้นหา, ดูล่าสุด, รายการเปรียบเทียบ
│       ├── graph.js           Graph (adjacency list) + BFS
│       ├── dsa.js             Trie, Merge Sort, Queue, Stack, Binary Search, Fisher–Yates
│       ├── api.js             เรียก Express (ไม่เรียก Open Library ตรง)
│       ├── components/        BookCard
│       └── pages/             Home, Book, Compare, History, About, NotFound
└── public/             งานแรก (Express เสิร์ฟ HTML ตรง ๆ) เก็บไว้เป็นหลักฐาน Before
```

แผนภาพการทำงาน: `React (5173) → Vite proxy → Express (3000) → Open Library API`

## 8.1 ตารางส่วนร่วม

| นายสิรวิชญ์ แสงจันทร์ | 681310411 | ชิ้นงานที่รับผิดชอบ (ไฟล์ / component / route / DSA) | ช่วงที่นำเสนอในคลิป |
| นางสาวภัคจิรา อินชูใจ | 681310788 | ชิ้นงานที่รับผิดชอบ (ไฟล์ / component / route / DSA) | ช่วงที่นำเสนอในคลิป |
|---|---|---|---|
| (ใส่ชื่อ) | (ใส่รหัส) | (เช่น `backend/server.js`, `/api/search`, `/api/work`, Hash Table cache) | ช่วงที่ 5 |
| (ใส่ชื่อ) | (ใส่รหัส) | (เช่น `HomePage.jsx`, `BookCard.jsx`, สถานะ loading/empty/error) | ช่วงที่ 2–3 |
| (ใส่ชื่อ) | (ใส่รหัส) | (เช่น `graph.js`, `App.jsx` NavBar, `AboutPage.jsx`) | ช่วงที่ 4 |

> ต้องตรงกับ commit history ใน GitHub

## 8.2 ข้อแนะนำจากงานแรก → สิ่งที่แก้

| ข้อแนะนำจากงานแรก | สิ่งที่แก้ในงานนี้ | หลักฐาน Before / After |
|---|---|---|
| หน้าแรกโหลด Harry Potter ตายตัว ให้เปลี่ยนเป็นสุ่มหนังสือ | หน้าแรกสุ่มหมวดด้วย Fisher–Yates (`shuffle(SEEDS)[0]`) ใน `HomePage.jsx` | Before: ภาพหน้าแรกงานแรก (main) · After: รีเฟรช 2 ครั้งได้หมวดต่างกัน |
| "ดูล่าสุด" (Stack) คลิกแล้วต้องเปิดเหมือนคลิกหนังสือปกติ | `HistoryPage` ใช้ `<Link to="/book/:id">` ไปหน้า `BookPage` เดียวกับ `BookCard` | Before: ภาพคลิกจาก Stack งานแรก · After: คลิกสองทางได้หน้าเดียวกัน |
| ปรับ interface ให้สวยขึ้น | จัด layout การ์ด/หัวข้อใหม่ มี dark mode และหน้า About แสดง Graph | Before: ภาพหน้าเว็บงานแรก · After: ภาพหน้าเว็บใหม่ |

## 8.3 ตาราง useState

| ชื่อ state | เก็บข้อมูลอะไร | อยู่ใน component | เปลี่ยนค่าเมื่อใด / โดยใคร | ทำไมต้องเป็น state |
|---|---|---|---|---|
| `dark` | โหมดมืด/สว่าง | `App` | กดปุ่มสลับธีมใน NavBar | เปลี่ยนแล้วต้องวาดหน้าจอใหม่ และ `useEffect` ใช้เป็น dependency |
| `query` | คำค้นล่าสุดที่ส่งไป Express | `AppProvider` (Context) | `run(q)` ตอนค้นหา | หลายหน้าใช้ร่วมกัน (Home แสดงในช่อง, `more()` ใช้ค้นต่อ) |
| `books` | รายการหนังสือผลค้นหา | `AppProvider` | `run` (ตั้งใหม่), `more` (ต่อท้าย) | Home/Compare ใช้ร่วมกัน และเปลี่ยนแล้วต้องวาดการ์ดใหม่ |
| `total` | จำนวนผลทั้งหมดจาก API | `AppProvider` | `run` หลังได้ผลจาก Express | แสดงบนหน้าจอ ได้ค่าจาก API คำนวณเองไม่ได้ |
| `status` | `idle / loading / ready / error` | `AppProvider` | `run`, `more` ตามผลเรียก API | ควบคุมข้อความ loading / empty / error / success |
| `hasMore` | ยังมีหน้าถัดไปให้โหลดไหม | `AppProvider` | `run`, `more` | ซ่อน/แสดงปุ่ม "โหลดเพิ่ม" (Queue เก็บใน `useRef` ไม่ต้องวาดใหม่ จึงต้องมี state นี้คู่กัน) |
| `recent` | Stack หนังสือที่ดูล่าสุด (สูงสุด 8) | `AppProvider` | `view(book)` ตอนคลิกการ์ด / เปิดหน้ารายละเอียด | ใช้ร่วมกันระหว่าง BookCard, BookPage, HistoryPage |
| `compare` | หนังสือที่เลือกเปรียบเทียบ (สูงสุด 3) | `AppProvider` | `toggleCompare(book)` | BookCard (ปุ่ม) และ ComparePage ใช้ร่วมกัน จึงยกขึ้นไปไว้ที่ Context |
| `text` | ข้อความในช่องค้นหา | `HomePage` | พิมพ์ในช่อง / เลือกคำแนะนำ | ช่อง input แบบ controlled และใช้แค่หน้า Home |
| `sug` | รายการคำแนะนำจาก Trie | `HomePage` | `onType` เมื่อพิมพ์ ≥ 2 ตัวอักษร | เปลี่ยนแล้วต้องแสดงกล่องคำแนะนำ |
| `sort` | วิธีเรียงผลลัพธ์ | `HomePage` | เลือกจาก dropdown / `jump` | เป็น input ของ `useMemo` ที่เรียง Merge Sort |
| `year` | ปีที่พิมพ์ในช่องกระโดด | `HomePage` | พิมพ์ในช่องปี | input แบบ controlled |
| `hl` | หนังสือที่ถูกไฮไลต์ (ผลจาก Binary Search) | `HomePage` | `jump` ตั้งค่า แล้วล้างใน 2.2 วินาที | ควบคุม highlight และเป็น dependency ของ effect เลื่อนจอ |
| `work` | รายละเอียดหนังสือรายเล่มจาก Express | `BookPage` | `getWork(id)` สำเร็จ | ได้ค่าแบบ async ต้องวาดหน้าใหม่ตอนข้อมูลมา |
| `err` | โหลดรายละเอียดล้มเหลวไหม | `BookPage` | `.catch` ของ `getWork` | แสดงข้อความ error |
| `from`, `to` | หน้าเริ่มต้น/ปลายทางที่เลือกตรวจ BFS | `AboutPage` | เลือกจาก dropdown | เปลี่ยนแล้วต้องคำนวณ `canReach` ใหม่ |

**ค่าที่ไม่เก็บเป็น state เพราะคำนวณจาก state/props อื่นได้:** `sorted` (`useMemo` จาก `books` + `sort`), `shared` และ `path` ใน `ComparePage` (คำนวณจาก `compare`/`books`), `picked` ใน `BookCard` (จาก `compare`), `orphans`/`deadEnds` ใน `AboutPage`

## 8.4 ตาราง useEffect

| component | effect ทำอะไร | dependency array | ทำงานตอนไหน |
|---|---|---|---|
| `App` | ใส่/เอา class `dark` ที่ `<body>` และบันทึกธีมลง `localStorage` | `[dark]` | ตอนเปิดแอป และทุกครั้งที่กดสลับธีม |
| `HomePage` #1 | ถ้า `status === 'idle'` ให้ค้นหาด้วยหมวดสุ่ม (`shuffle(SEEDS)[0]`) ผ่าน Express | `[]` | ครั้งเดียวตอน mount เท่านั้น (เงื่อนไข `idle` กันโหลดซ้ำเมื่อกลับมาหน้าแรก) |
| `HomePage` #2 | sync ข้อความในช่องค้นหาให้ตรงกับ `query` ใน Context | `[query]` | เมื่อ `query` เปลี่ยน (เช่น ค้นจากปุ่ม/คำแนะนำ) |
| `HomePage` #3 | เลื่อนจอไปที่การ์ดที่ไฮไลต์ | `[hl]` | เมื่อกด "ไป" ปีแล้ว `hl` เปลี่ยน |
| `BookPage` | ล้าง `work`/`err`, บันทึกเข้า Stack ดูล่าสุด, เรียก `getWork(id)` จาก Express | `[id]` | ตอนเปิดหน้า และเมื่อ `id` ใน URL เปลี่ยน |

**ป้องกัน loop / เรียก API ซ้ำ:** effect ที่เรียก API มี dependency เฉพาะค่าที่ตั้งใจ (`[]` และ `[id]`) ไม่ใส่ state ที่ effect เปลี่ยนเอง (`books`, `status`, `work`) เพื่อไม่ให้ effect ถูกเรียกวนซ้ำ และ Express มี cache จึงไม่ยิง Open Library ซ้ำเมื่อคำค้นเดิม

## Graph.js เชื่อมเมนูกับหน้า

- `pageGraph` เป็น directed adjacency list: node = หน้า (home, compare, history, about), edge = `<Link>` บน NavBar
- `NavBar` อ่าน `pageGraph[current]` แล้ว map เป็น `<Link>` ไม่มีรายการเมนูตายตัว
- `canReach` (BFS: queue + visited Set, O(V+E)) และ `checkGraph()` ตรวจหน้า orphan และทางตัน
- Graph ที่สอง (undirected) เชื่อม หนังสือ–ผู้แต่ง–หมวดหมู่ ใช้ BFS หาเส้นทางสั้นสุดระหว่างหนังสือสองเล่มในหน้า Compare

## Express ทำหน้าที่อะไร (backend/server.js)

| หน้าที่ | รายละเอียด |
|---|---|
| Proxy | React ไม่เรียก Open Library ตรง ผ่าน `/api/search` และ `/api/work` |
| Validate | จำกัดความยาวคำค้น (≤ 100), `page` 1–50, `limit` 1–40, `key` ต้องตรง `/works/OL...W` ไม่ถูกต้องตอบ 400 |
| Cache | เก็บผลใน Custom Hash Table (Array of buckets + chaining) พร้อม TTL 10 นาที |
| Timeout + Error | ตัดการรอ Open Library ที่ 15 วินาที ตอบ 502 เป็น JSON ระบบไม่ล่ม และหน้าเว็บมีปุ่ม "ลองใหม่" |

## DSA ที่ใช้กับข้อมูลจริง

| DSA | ฝั่ง | ใช้ทำอะไร | Big-O |
|---|---|---|---|
| Custom Hash Table | Express | cache ผลค้นหา/รายละเอียดตาม key | get/set เฉลี่ย O(1) |
| Graph + BFS | React | NavBar, ตรวจหน้า orphan/ทางตัน, หาเส้นทางระหว่างหนังสือ | O(V+E) |
| Trie | React | คำแนะนำชื่อหนังสือตอนพิมพ์ | O(L) ต่อคำ |
| Merge Sort | React | เรียงผลตามปี/จำนวน edition/ชื่อ | O(n log n) |
| Binary Search | React | กระโดดไปปีที่ใกล้ที่สุดในรายการที่เรียงแล้ว | O(log n) |
| Queue | React | คิว offset ของ "โหลดเพิ่ม" | O(1) enqueue |
| Stack (จำกัดขนาด) | React | ดูล่าสุด 8 รายการ | O(n) ต่อ push (n ≤ 8) |
| Fisher–Yates | React | สุ่มหมวดหน้าแรกและปุ่มสุ่ม | O(n) |
| Set Intersection | React | หมวดหมู่ร่วมของหนังสือที่เลือกเปรียบเทียบ | O(n·k) |

**ตัวเลขเทียบก่อน-หลัง cache (ใส่จากที่วัดจริง):** ค้น `dune` ครั้งแรก `cached:false` = ___ ms · ครั้งที่สอง `cached:true` = ___ ms

## ลิงก์

- YouTube (Unlisted): (ใส่ลิงก์)
- Vercel (ไม่บังคับ): (ใส่ลิงก์ถ้ามี)
