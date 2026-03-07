const fs = require('fs');
const file = './src/lib/api-client.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'return JSON.parse(text);',
  `const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && 'success' in parsed && 'data' in parsed) {
        if (parsed.success) return parsed.data as T;
      }
      return parsed;`
);
fs.writeFileSync(file, content);
