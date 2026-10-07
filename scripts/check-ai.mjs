import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { aiConfig, generateAnswer } from '../ai-provider.mjs';

if (existsSync(resolve('.env'))) process.loadEnvFile(resolve('.env'));
const config = aiConfig();
console.log('Nhà cung cấp:', config.provider, '| Mô hình:', config.model);
try {
  const result = await generateAnswer({ message: 'Chỉ trả lời chính xác: Gemini đã kết nối.', mode: 'summary', context: '' });
  console.log('Thử kết nối thành công:', result.answer);
} catch (error) {
  console.error('Thử kết nối không thành công:', error.code || 'unavailable');
  console.error('Kiểm tra khóa API, quyền dùng mô hình và hạn mức tại nhà cung cấp. Không gửi khóa lên chat hoặc GitHub.');
  process.exitCode = 1;
}
