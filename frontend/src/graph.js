/* ============ Graph #1: กราฟของหน้าเว็บ (directed adjacency list) ============
   key = หน้าปัจจุบัน, array = หน้าที่มี <Link> ไปถึง (1 Link บนจอ = 1 edge) */
export const pageGraph = {
  home: ['compare', 'history', 'about'],
  compare: ['home', 'about'],
  history: ['home', 'compare'],
  about: ['home'],
};
export const pagePaths = { home: '/', compare: '/compare', history: '/history', about: '/about' };
export const pageLabels = { home: 'หน้าหลัก', compare: 'เปรียบเทียบ', history: 'ดูล่าสุด', about: 'Graph / เกี่ยวกับ' };

// BFS: queue + visited Set  → O(V+E)
export function canReach(start, end) {
  if (!(start in pageGraph)) return false;
  const queue = [start];
  const visited = new Set([start]);
  while (queue.length > 0) {
    const current = queue.shift(); // dequeue
    if (current === end) return true;
    for (const neighbor of pageGraph[current] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor); // enqueue
      }
    }
  }
  return false;
}

export function checkGraph() {
  const pages = Object.keys(pageGraph);
  return {
    orphans: pages.filter((p) => !canReach('home', p)),   // ไปไม่ถึงจาก home
    deadEnds: pages.filter((p) => !canReach(p, 'home')),  // ทางตัน
  };
}

/* ============ Graph #2: กราฟของหนังสือ (undirected) ============
   โหนด: book:<key> / author:<ชื่อ> / subject:<หมวด>  เชื่อมกันสองทาง */
export function buildBookGraph(books) {
  const g = {};
  const add = (a, b) => { g[a] ??= []; if (!g[a].includes(b)) g[a].push(b); };
  const link = (a, b) => { add(a, b); add(b, a); };
  books.forEach((b) => {
    const bk = 'book:' + b.key;
    (b.author_name || []).forEach((a) => link(bk, 'author:' + a));
    (b.subject || []).slice(0, 6).forEach((s) => link(bk, 'subject:' + s.toLowerCase()));
  });
  return g;
}

// BFS หาเส้นทางสั้นที่สุด (จำนวน edge น้อยสุด) โดยเก็บ parent ไว้ย้อนรอย
export function shortestPath(g, start, end) {
  if (!g[start] || !g[end]) return null;
  const parent = { [start]: null };
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === end) {
      const path = [];
      for (let n = end; n !== null; n = parent[n]) path.push(n);
      return path.reverse();
    }
    for (const nb of g[cur]) {
      if (!(nb in parent)) { parent[nb] = cur; queue.push(nb); }
    }
  }
  return null;
}
