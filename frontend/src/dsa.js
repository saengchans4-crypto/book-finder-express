/* ===== Trie: autocomplete ===== */
class TrieNode { constructor() { this.children = {}; this.end = false; } }
export class Trie {
  constructor() { this.root = new TrieNode(); }
  insert(word) {
    let n = this.root;
    for (const ch of word.toLowerCase()) {
      if (!n.children[ch]) n.children[ch] = new TrieNode();
      n = n.children[ch];
    }
    n.end = true;
  }
  startsWith(prefix, limit = 8) {
    const p = prefix.toLowerCase();
    let n = this.root;
    for (const ch of p) { if (!n.children[ch]) return []; n = n.children[ch]; }
    const out = [];
    const walk = (node, acc) => {
      if (out.length >= limit) return;
      if (node.end) out.push(p + acc);
      for (const ch in node.children) walk(node.children[ch], acc + ch);
    };
    walk(n, '');
    return out;
  }
}

/* ===== Merge Sort: เรียงผลลัพธ์ O(n log n) (ไม่แก้ array เดิม) ===== */
export function mergeSort(arr, cmp) {
  if (arr.length <= 1) return arr;
  const mid = arr.length >> 1;
  const left = mergeSort(arr.slice(0, mid), cmp);
  const right = mergeSort(arr.slice(mid), cmp);
  const out = []; let i = 0, j = 0;
  while (i < left.length && j < right.length) out.push(cmp(left[i], right[j]) <= 0 ? left[i++] : right[j++]);
  return out.concat(left.slice(i), right.slice(j));
}

/* ===== Queue (FIFO): คิว offset สำหรับ "โหลดเพิ่ม" ===== */
export class Queue {
  constructor() { this.items = []; }
  enqueue(x) { this.items.push(x); }
  dequeue() { return this.items.shift(); }
  get size() { return this.items.length; }
}

/* ===== Stack (LIFO) แบบจำกัดขนาด: ดูล่าสุด ===== */
export function pushRecent(stack, item, limit = 8) {
  return [item, ...stack.filter((x) => x.key !== item.key)].slice(0, limit);
}

/* ===== Binary Search: หาเล่มที่ปีใกล้ที่สุด (array ต้องเรียงตามปีแล้ว) ===== */
export function binarySearchClosest(sorted, target, getYear) {
  let lo = 0, hi = sorted.length - 1;
  if (hi < 0) return -1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (getYear(sorted[mid]) < target) lo = mid + 1; else hi = mid;
  }
  return lo;
}

/* ===== Fisher–Yates Shuffle: สุ่มแบบ unbiased ===== */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ===== Set Intersection: หมวดหมู่ร่วมกัน ===== */
export function intersectAll(lists) {
  if (!lists.length) return [];
  let inter = new Set(lists[0]);
  for (let i = 1; i < lists.length; i++) {
    const s = new Set(lists[i]);
    inter = new Set([...inter].filter((x) => s.has(x)));
  }
  return [...inter];
}
