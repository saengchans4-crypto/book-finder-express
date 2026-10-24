import test from 'node:test';
import assert from 'node:assert/strict';
import { Trie, mergeSort, Queue, pushRecent, binarySearchClosest, shuffle, intersectAll } from '../src/dsa.js';

test('mergeSort: เรียงถูกและไม่แก้ array เดิม', () => {
  const src = [5, 2, 9, 1, 5, 6];
  assert.deepEqual(mergeSort(src, (a, b) => a - b), [1, 2, 5, 5, 6, 9]);
  assert.deepEqual(src, [5, 2, 9, 1, 5, 6]);
});

test('binarySearchClosest: เจอปีที่ตรง/ใกล้ที่สุดไปทางหลัง', () => {
  const years = [1985, 1990, 2001, 2010];
  assert.equal(binarySearchClosest(years, 1990, (y) => y), 1);
  assert.equal(binarySearchClosest(years, 1995, (y) => y), 2);
  assert.equal(binarySearchClosest([], 1995, (y) => y), -1);
});

test('Trie: ค้นด้วย prefix', () => {
  const t = new Trie();
  ['Harry Potter', 'Harry Houdini', 'Hamlet'].forEach((w) => t.insert(w));
  assert.deepEqual(t.startsWith('har'), ['harry potter', 'harry houdini']);
  assert.deepEqual(t.startsWith('zzz'), []);
});

test('Queue: FIFO', () => {
  const q = new Queue(); q.enqueue(1); q.enqueue(2);
  assert.equal(q.dequeue(), 1);
  assert.equal(q.size, 1);
});

test('pushRecent: Stack ไม่ซ้ำ ล่าสุดอยู่บนสุด จำกัดขนาด', () => {
  let s = [];
  for (let i = 1; i <= 10; i++) s = pushRecent(s, { key: i }, 8);
  assert.equal(s.length, 8);
  assert.equal(s[0].key, 10);
  s = pushRecent(s, { key: 5 }, 8);
  assert.equal(s[0].key, 5);
  assert.equal(s.filter((x) => x.key === 5).length, 1);
});

test('intersectAll: หมวดหมู่ร่วมกัน', () => {
  assert.deepEqual(intersectAll([['a', 'b'], ['b', 'c'], ['b']]), ['b']);
  assert.deepEqual(intersectAll([]), []);
});

test('shuffle: ได้สมาชิกครบเท่าเดิม', () => {
  const out = shuffle([1, 2, 3, 4, 5]);
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5]);
});
