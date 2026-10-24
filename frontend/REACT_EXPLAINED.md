# อธิบาย React ผ่านโปรเจกต์นี้

## React คืออะไร
ไลบรารี JavaScript สำหรับสร้าง UI จาก **component** (ฟังก์ชันที่ return หน้าตา UI ด้วย JSX)
แนวคิดหลักคือ **declarative**: เราบอกว่า "ถ้า state เป็นแบบนี้ หน้าจอควรเป็นแบบไหน" แล้ว React อัปเดต DOM ให้เอง
(เทียบ Virtual DOM แล้วแก้เฉพาะจุดที่เปลี่ยน) ไม่ต้องสั่งแก้ DOM ทีละจุดเหมือนโค้ด JavaScript เดิม

## แนวคิดสำคัญ → อยู่ตรงไหนในโค้ด
| แนวคิด | ความหมาย | ตัวอย่างในโปรเจกต์ |
|---|---|---|
| Component | ฟังก์ชันที่ return JSX | `BookCard`, `NavBar`, `HomePage` |
| Props | ข้อมูลที่ parent ส่งให้ child (อ่านอย่างเดียว) | `<BookCard book={b} highlight={...} />` |
| State (`useState`) | ข้อมูลที่เปลี่ยนแล้ว React วาดหน้าจอใหม่ | `text`, `sort`, `year` ใน `HomePage` |
| Effect (`useEffect`) | ทำงานข้างเคียงหลัง render เช่น เรียก API | `BookPage` ดึงรายละเอียดเมื่อ `id` เปลี่ยน |
| `useMemo` | จำผลคำนวณ ไม่คำนวณซ้ำถ้า input เดิม | `sorted` (Merge Sort) ใน `HomePage` |
| `useRef` | เก็บค่าที่ไม่ต้องให้หน้าจอวาดใหม่ | `trie`, `index`, `pages` (Queue) ใน `AppContext` |
| Context | แชร์ state ข้ามหน้าโดยไม่ต้องส่ง props ต่อกันหลายชั้น | `AppProvider` / `useApp()` |

**One-way data flow:** ข้อมูลไหลลงจาก parent → child ผ่าน props เท่านั้น child จะแก้ state ของ parent
ผ่านฟังก์ชันที่ parent ส่งลงมา (เช่น `toggleCompare` จาก Context)

## Component tree
```
App
└─ BrowserRouter
   └─ AppProvider (Context)
      ├─ NavBar            ← อ่าน pageGraph สร้าง <Link>
      └─ <Routes>
         └─ <Route> → HomePage → BookCard (หลายใบ)
                      ComparePage / HistoryPage / AboutPage / BookPage / NotFound
```

## React Router เปลี่ยน URL โดยไม่ reload ได้อย่างไร
1. `<Link to="/about">` ไม่ใช่ลิงก์ HTML ปกติ — ตอนคลิกมันกัน default ของ browser (ไม่โหลดหน้าใหม่)
2. แล้วเรียก **History API** (`history.pushState`) เปลี่ยน URL บน address bar
3. `<Routes>` รับรู้ว่า URL เปลี่ยน → เทียบ `path` ของแต่ละ `<Route>` → render component ที่ตรง
4. ทั้งหมดเกิดในหน้าเดียว (SPA) state ใน Context จึงไม่หาย (ผลค้นหาไม่ต้องโหลดใหม่)

ถ้าใช้ `<a href>` browser จะขอไฟล์ HTML ใหม่จากเซิร์ฟเวอร์ → โหลดหน้าใหม่ทั้งหมด → state รีเซ็ต
(ที่ต้องมี `vercel.json` rewrite เพราะถ้ารีเฟรชที่ `/book/xxx` เซิร์ฟเวอร์ต้องส่ง `index.html` เดิมให้ React Router จัดการต่อ)

## Graph ↔ React Router
| Graph | React Router |
|---|---|
| node (หน้า) | `<Route path>` + page component |
| edge (ลิงก์) | `<Link to>` ใน NavBar |
| adjacency list `pageGraph[current]` | รายการ Link ที่ NavBar แสดง |
| BFS `canReach` / `checkGraph` | ตรวจว่าทุกหน้าไปถึงได้ (orphans) และไม่มีทางตัน (deadEnds) |

## คำถามที่น่าจะโดนถาม
- **adjacency list เก็บอะไร / เพิ่มหน้าใหม่ต้องแก้อะไร?** เก็บ "หน้า → หน้าที่ลิงก์ไปถึง" ต้องเพิ่ม key ใน `pageGraph` + `pagePaths` + `<Route>` ใน `App.jsx`
  ถ้าลืมใส่ชื่อหน้าใหม่ใน array ของหน้าอื่น → `checkGraph()` รายงานเป็น **orphan**
- **BFS O(V+E) คืออะไร?** เยี่ยมแต่ละ node ไม่เกิน 1 ครั้ง (V) และไล่ตรวจแต่ละ edge ไม่เกิน 1 ครั้ง (E)
  100 หน้า 300 ลิงก์ ≈ 400 steps ต่อครั้ง; `checkGraph()` เรียก BFS 2×V ครั้ง (orphans V + deadEnds V)
- **ทำไม BFS ใช้ Queue?** เพราะต้องสำรวจทีละชั้น (FIFO) จึงได้เส้นทางที่ edge น้อยสุดก่อน — ใช้หา `shortestPath` ระหว่างหนังสือ
- **ทำไมต้อง `visited`?** กันวนซ้ำใน graph ที่มี cycle (home ↔ about)
