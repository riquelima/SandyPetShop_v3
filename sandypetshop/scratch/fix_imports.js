import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('@/src/')) {
        const relativeToRoot = path.relative(path.dirname(fullPath), __dirname);
        const replacement = relativeToRoot === '' ? './src/' : relativeToRoot + '/src/';
        content = content.replace(/@\/src\//g, replacement);
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));

for (const file of ['index.tsx', 'App.tsx']) {
  if (fs.existsSync(path.join(__dirname, file))) {
    const fullPath = path.join(__dirname, file);
    let content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes('@/src/')) {
      content = content.replace(/@\/src\//g, './src/');
      fs.writeFileSync(fullPath, content);
      console.log(`Updated ${fullPath}`);
    }
  }
}
