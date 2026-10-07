import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiConfig, generateAnswer } from '../ai-provider.mjs';
import { deploymentConfig } from '../deployment.mjs';

const env = { GEMINI_API_KEY: 'test-only-key', GEMINI_MODEL: 'gemini-3.5-flash-lite' };
const question = { message: 'Giải thích cung cầu', mode: 'summary', context: 'Cung và cầu' };

test('Gemini dùng header khóa, endpoint Google cố định, không đặt khóa trong URL/body', async () => {
  const result = await generateAnswer(question, { env, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
    assert.equal(options.headers['x-goog-api-key'], env.GEMINI_API_KEY);
    assert.ok(!url.includes(env.GEMINI_API_KEY));
    assert.ok(!options.body.includes(env.GEMINI_API_KEY));
    const body = JSON.parse(options.body);
    assert.match(body.contents[0].parts[0].text, /Giải thích cung cầu/);
    assert.ok(body.systemInstruction.parts[0].text.length > 0);
    return { ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Ẩn suy luận', thought: true }, { text: 'Giải thích ngắn.' }] } }] }) };
  } });
  assert.equal(result.answer, 'Giải thích ngắn.');
  assert.equal(result.provider, 'gemini');
});

test('Không gọi dịch vụ khi không có khóa hoặc đang chọn thư viện', async () => {
  assert.equal(aiConfig({}).enabled, false);
  assert.equal(aiConfig({ ...env, AI_PROVIDER: 'library' }).enabled, false);
  await assert.rejects(generateAnswer(question, { env: {}, fetchImpl: () => assert.fail('unexpected network') }), { code: 'not_configured' });
});

test('Mô hình không thể chèn URL khác hoặc query chứa khóa', async () => {
  await assert.rejects(generateAnswer(question, { env: { ...env, GEMINI_MODEL: '../../evil?key=secret' }, fetchImpl: () => assert.fail('unexpected network') }), { code: 'invalid_model' });
});

test('Lỗi khóa, hạn mức, mô hình và dịch vụ trả mã an toàn, không lộ body nhà cung cấp', async () => {
  for (const [status, code] of [[403, 'credentials_or_request'], [429, 'quota'], [404, 'model_unavailable'], [503, 'unavailable']]) {
    await assert.rejects(generateAnswer(question, { env, fetchImpl: async () => ({ ok: false, status, json() { assert.fail('must not expose provider body'); } }) }), { code });
  }
});

test('Timeout được phân biệt với lỗi mạng', async () => {
  await assert.rejects(generateAnswer(question, { env, fetchImpl: async () => { const e = new Error('secret detail'); e.name = 'TimeoutError'; throw e; } }), { code: 'timeout' });
});

test('Gemini không trả văn bản rỗng hoặc nội dung đã bị chặn', async () => {
  for (const [output, code] of [[{ candidates: [] }, 'empty_response'], [{ promptFeedback: { blockReason: 'SAFETY' } }, 'blocked']]) {
    await assert.rejects(generateAnswer(question, { env, fetchImpl: async () => ({ ok: true, json: async () => output }) }), { code });
  }
});

test('Tích hợp OpenAI cũ vẫn hoạt động khi được chọn rõ ràng', async () => {
  const result = await generateAnswer(question, { env: { AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test-openai-key' }, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(JSON.parse(options.body).store, false);
    return { ok: true, json: async () => ({ output: [{ content: [{ type: 'output_text', text: 'OK' }] }] }) };
  } });
  assert.equal(result.answer, 'OK');
});

test('Render tự nhận URL nền tảng, Vercel chỉ được thêm với tên miền chính xác', () => {
  const config = deploymentConfig({ NODE_ENV: 'production', RENDER_EXTERNAL_URL: 'https://my-app.onrender.com', ADDITIONAL_ORIGINS: 'https://my-app.vercel.app' }, '0.0.0.0', 10000);
  assert.equal(config.origin, 'https://my-app.onrender.com');
  assert.ok(config.origins.has('https://my-app.vercel.app'));
  assert.ok(!config.origins.has('https://evil-my-app.vercel.app'));
  assert.ok(config.hosts.has('my-app.onrender.com'));
});

test('Production từ chối HTTP, URL có đường dẫn, credentials hoặc wildcard', () => {
  for (const origin of ['http://my-app.vercel.app', 'https://my-app.vercel.app/', 'https://my-app.vercel.app/path', 'https://user:pass@my-app.vercel.app', 'https://*.vercel.app']) {
    assert.throws(() => deploymentConfig({ NODE_ENV: 'production', APP_ORIGIN: origin }, '0.0.0.0', 3000));
  }
});
