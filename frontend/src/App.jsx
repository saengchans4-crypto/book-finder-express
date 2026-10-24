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
  const { pathname } = useLocation();
  const current = Object.keys(pagePaths).find((n) => pagePaths[n] === pathname);
  const links = current ? pageGraph[current] : ['home']; // หน้านอก graph (รายละเอียด/404) กลับ home ได้
  return (
    <header className="nav">
      <span className="brand serif">Stacks</span>
      <nav>
        {links.map((n) => <Link key={n} to={pagePaths[n]}>{pageLabels[n]}</Link>)}
      </nav>
      <button className="btn small" onClick={toggle}>{dark ? '☀️ สว่าง' : '🌙 มืด'}</button>
    </header>
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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/book/:id" element={<BookPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </AppProvider>
    </BrowserRouter>
  );
}
