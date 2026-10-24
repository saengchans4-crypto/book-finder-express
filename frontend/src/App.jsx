import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppProvider } from './AppContext';
import { pageGraph, pagePaths, pageLabels, checkGraph } from './graph';
import HomePage from './pages/HomePage';
import BookPage from './pages/BookPage';
import ComparePage from './pages/ComparePage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';
import NotFound from './pages/NotFound';

// NavBar = edges ของหน้าปัจจุบัน (ทุก <Link> บนจอ = 1 edge)
function NavBar({ dark, toggle }) {
  const loc = useLocation();
  const pathname = (loc.state?.background || loc).pathname; // ตอนเปิดหน้าต่างหนังสือ เมนูยังเป็นของหน้าเดิม
  const current = Object.keys(pagePaths).find((n) => pagePaths[n] === pathname);
  const links = current ? pageGraph[current] : ['home']; // หน้านอก graph (รายละเอียด/404) กลับ home ได้
  return (
    <header className="nav">
      {current !== 'home' && <span className="brand">Book Finder</span>}
      <nav>
        {links.map((n) => <Link key={n} to={pagePaths[n]}>{pageLabels[n]}</Link>)}
      </nav>
      <button className="btn small" onClick={toggle}>{dark ? '☀️ โหมดสว่าง' : '🌙 โหมดมืด'}</button>
    </header>
  );
}

// ถ้าเปิดหนังสือจากการ์ด จะมี state.background ให้วาดหน้าเดิมไว้ข้างหลัง แล้วแสดงหนังสือเป็นหน้าต่างทับ
function AppRoutes() {
  const location = useLocation();
  const background = location.state?.background;
  return (
    <>
      <Routes location={background || location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/book/:id" element={<BookPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {background && (
        <Routes>
          <Route path="/book/:id" element={<BookPage modal />} />
        </Routes>
      )}
    </>
  );
}

// ตรวจ graph ด้วย BFS ครั้งเดียวตอนโหลดแอป
const { orphans, deadEnds } = checkGraph();
console.log('ไปไม่ถึงจาก home:', orphans);
console.log('ทางตัน:', deadEnds);

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('stacks-theme') === 'dark');
  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('stacks-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <BrowserRouter>
      <AppProvider>
        <NavBar dark={dark} toggle={() => setDark((d) => !d)} />
        <main>
          <AppRoutes />
        </main>
      </AppProvider>
    </BrowserRouter>
  );
}