export function deploymentConfig(env, host, port) {
  const primary = env.APP_ORIGIN || env.RENDER_EXTERNAL_URL || `http://${host}:${port}`;
  const values = [primary, ...(env.ADDITIONAL_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean)];
  const origins = new Set();
  for (const value of values) {
    let parsed;
    try { parsed = new URL(value); } catch { throw new Error('Origin phải là URL đầy đủ.'); }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== value || parsed.hostname.includes('*') || parsed.username || parsed.password || (env.NODE_ENV === 'production' && parsed.protocol !== 'https:')) {
      throw new Error('Origin phải chính xác, không có đường dẫn, dấu / cuối, ký tự đại diện hoặc thông tin đăng nhập; production cần HTTPS.');
    }
    origins.add(value);
  }
  return { origin: primary, origins, hosts: new Set([...origins].map(v => new URL(v).host)) };
}
