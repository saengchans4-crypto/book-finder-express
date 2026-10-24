import test from 'node:test';
import assert from 'node:assert/strict';
import { pageGraph, pagePaths, canReach, checkGraph, buildBookGraph, shortestPath } from '../src/graph.js';

test('checkGraph: ไม่มี orphans และไม่มี deadEnds', () => {
  assert.deepEqual(checkGraph(), { orphans: [], deadEnds: [] });
});

test('ทุก node มี path และทุก neighbor เป็น node ที่มีอยู่จริง', () => {
  for (const [node, neighbors] of Object.entries(pageGraph)) {
    assert.ok(pagePaths[node], `${node} ต้องมี path`);
    for (const n of neighbors) assert.ok(n in pageGraph, `${node} → ${n} ต้องเป็น node ที่มีอยู่`);
  }
});

test('canReach: BFS ไปถึง/ไปไม่ถึง', () => {
  assert.equal(canReach('home', 'about'), true);
  assert.equal(canReach('about', 'compare'), true); // about → home → compare
  assert.equal(canReach('home', 'home'), true);
  assert.equal(canReach('home', 'nope'), false);
  assert.equal(canReach('nope', 'home'), false);
});

const books = [
  { key: '/works/1', author_name: ['X'], subject: ['Magic', 'War'] },
  { key: '/works/2', author_name: ['Y'], subject: ['War'] },
  { key: '/works/3', author_name: ['X'], subject: ['Sea'] },
  { key: '/works/4', author_name: ['Z'], subject: ['Space'] },
];

test('shortestPath: เส้นทางสั้นสุดระหว่างหนังสือ (ผ่านหมวดหมู่/ผู้แต่ง)', () => {
  const g = buildBookGraph(books);
  assert.deepEqual(shortestPath(g, 'book:/works/2', 'book:/works/1'), ['book:/works/2', 'subject:war', 'book:/works/1']);
  assert.equal(shortestPath(g, 'book:/works/2', 'book:/works/3').length, 5);
});

test('shortestPath: ไม่เชื่อมกัน → null', () => {
  const g = buildBookGraph(books);
  assert.equal(shortestPath(g, 'book:/works/1', 'book:/works/4'), null);
  assert.equal(shortestPath(g, 'book:/works/1', 'book:/works/999'), null);
});
