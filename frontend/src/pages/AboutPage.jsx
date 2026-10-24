import { useState } from 'react';
import { pageGraph, pagePaths, canReach, checkGraph } from '../graph';

export default function AboutPage() {
  const nodes = Object.keys(pageGraph);
  const { orphans, deadEnds } = checkGraph();
  const [from, setFrom] = useState('home');
  const [to, setTo] = useState('about');
  const V = nodes.length;
  const E = nodes.reduce((s, n) => s + pageGraph[n].length, 0);
  // วางโหนดบนวงกลม + รายการ edge (ทิศทาง a → b) สำหรับวาดภาพ
  const pos = {};
  nodes.forEach((n, i) => {
    const ang = (2 * Math.PI * i) / V - Math.PI / 2;
    pos[n] = { x: 160 + 110 * Math.cos(ang), y: 140 + 100 * Math.sin(ang) };
  });
  const edges = nodes.flatMap((a) => pageGraph[a].map((b) => ({ a, b })));

  return (
    <section>
      <h2 className="serif">Graph ของหน้าเว็บ</h2>
      <p>แต่ละหน้าคือ node และ &lt;Link&gt; บน NavBar คือ edge (directed adjacency list)</p>
      <table className="tbl">
        <thead><tr><th>Node</th><th>Path</th><th>Neighbors (edges ออก)</th></tr></thead>
        <tbody>
          {nodes.map((n) => (
            <tr key={n}><td>{n}</td><td>{pagePaths[n]}</td><td>{pageGraph[n].join(', ') || '— (ทางตัน)'}</td></tr>
          ))}
        </tbody>
      </table>
      <svg viewBox="0 0 320 280" className="graphviz" role="img" aria-label="แผนผัง pageGraph">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" style={{ fill: 'var(--navy)' }} />
          </marker>
        </defs>
        {edges.map(({ a, b }) => {
          const p = pos[a], q = pos[b];
          const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy);
          const ux = dx / len, uy = dy / len, r = 26;
          const sx = p.x + ux * r, sy = p.y + uy * r, ex = q.x - ux * (r + 4), ey = q.y - uy * (r + 4);
          const cx = (sx + ex) / 2 - uy * 16, cy = (sy + ey) / 2 + ux * 16; // โค้งเพื่อแยกเส้นไป/กลับ
          return <path key={a + '>' + b} d={`M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}`} markerEnd="url(#arr)"
                       style={{ fill: 'none', stroke: 'var(--navy)', strokeWidth: 1.5 }} />;
        })}
        {nodes.map((n) => (
          <g key={n}>
            <circle cx={pos[n].x} cy={pos[n].y} r="26" style={{ fill: 'var(--card)', stroke: 'var(--navy)', strokeWidth: 2 }} />
            <text x={pos[n].x} y={pos[n].y + 4} textAnchor="middle" fontSize="11" style={{ fill: 'var(--ink)' }}>{n}</text>
          </g>
        ))}
      </svg>
      <p>V = {V}, E = {E} → BFS ใช้ O(V+E) = {V + E} steps ต่อครั้ง</p>
      <p>orphans (ไปไม่ถึงจาก home): <b>[{orphans.join(', ')}]</b> · deadEnds (ทางตัน): <b>[{deadEnds.join(', ')}]</b></p>

      <div className="panel">
        <h3>ทดลอง canReach (BFS)</h3>
        <select value={from} onChange={(e) => setFrom(e.target.value)}>{nodes.map((n) => <option key={n}>{n}</option>)}</select>
        {' → '}
        <select value={to} onChange={(e) => setTo(e.target.value)}>{nodes.map((n) => <option key={n}>{n}</option>)}</select>
        <p>ผลลัพธ์: <b>{String(canReach(from, to))}</b></p>
      </div>

      <div className="panel">
        <h3>DSA ที่ใช้ในโปรเจกต์</h3>
        <ul>
          <li>Graph + BFS — NavBar (directed), เส้นทางสั้นสุดระหว่างหนังสือ (undirected)</li>
          <li>Trie — autocomplete · Merge Sort — เรียงผลลัพธ์ · Binary Search — กระโดดไปปี</li>
          <li>Queue — โหลดเพิ่ม · Stack — ดูล่าสุด · Set — หมวดหมู่ร่วม · Fisher–Yates — สุ่ม</li>
        </ul>
      </div>
    </section>
  );
}
