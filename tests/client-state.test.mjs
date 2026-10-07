import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

// Run the actual client functions with a controlled, delayed transport.
// DOM rendering is stubbed; these tests exercise account/conversation boundaries.
const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
function client() {
  const context = createContext({
    document: { addEventListener() {}, querySelector() { return null; } },
    window: { addEventListener() {} },
    setInterval() {}, clearInterval() {}, setTimeout() {}, Intl,
  });
  runInContext(source.replace(/boot\(\);\s*$/, ''), context);
  runInContext(`
    let requestCount = 0, finishRequest, renderCount = 0;
    render = () => { renderCount++; };
    api = () => { requestCount++; return new Promise(resolve => { finishRequest = resolve; }); };
    state.user = { id: 'student-a' };
    state.route = 'ai';
  `, context);
  return (code) => runInContext(code, context);
}

test('Lịch mặc định mở tuần hiện tại, không dùng buổi học cũ', () => {
  const run = client();
  run(`state.data = { today: '2026-10-14', schedules: [{ start: '2025-01-02T09:00' }] };`);
  assert.equal(run('localDate(weekStart())'), '2026-10-12');
  run(`state.week = '2026-10-19';`);
  assert.equal(run('localDate(weekStart())'), '2026-10-19');
});

test('Trợ lý chỉ gửi một yêu cầu trong lúc đang trả lời', async () => {
  const run = client();
  const pending = run(`chatSend('Cung cầu là gì?')`);
  await run(`chatSend('Câu thứ hai')`);
  assert.equal(run('requestCount'), 1);
  run(`finishRequest({ answer: 'Câu trả lời', sources: [], engine: 'library' });`);
  await pending;
  assert.equal(run('state.chat.length'), 2);
  assert.equal(run('state.chatPending'), false);
});

test('Phản hồi cũ không xuất hiện sau khi đổi tài khoản', async () => {
  const run = client();
  const pending = run(`chatSend('Tiến độ của tôi')`);
  run(`state.chat = []; state.chatPending = false; state.user = { id: 'student-b' };`);
  run(`finishRequest({ answer: 'Thông tin riêng của A', sources: [] });`);
  await pending;
  assert.equal(run('state.chat.length'), 0);
  assert.equal(run('renderCount'), 1);
});

test('Xóa hội thoại đang chờ không làm phản hồi cũ quay lại', async () => {
  const run = client();
  const pending = run(`chatSend('Câu cũ')`);
  const finishOld = run('finishRequest');
  run(`state.chat = []; state.chatPending = false;`);
  const newPending = run(`chatSend('Câu mới')`);
  finishOld({ answer: 'Câu trả lời cũ', sources: [] });
  await pending;
  assert.equal(run('state.chat.length'), 1);
  assert.equal(run('state.chatPending'), true);
  run(`finishRequest({ answer: 'Trả lời câu mới', sources: [] });`);
  await newPending;
  assert.equal(run('state.chat[0].text'), 'Câu mới');
  assert.equal(run('state.chat.length'), 2);
});

test('Trợ lý trả lời không dựng lại trang khác và làm mất nội dung đang nhập', async () => {
  const run = client();
  const pending = run(`chatSend('Lập kế hoạch')`);
  run(`state.route = 'settings'; finishRequest({ answer: 'Kế hoạch', sources: [] });`);
  await pending;
  assert.equal(run('renderCount'), 1);
  assert.equal(run('state.chat.length'), 2);
  assert.equal(run('state.chatPending'), false);
});
