const fs = require('fs');
const path = require('path');

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
        // Calculate relative path from this file's directory to the project root
        const relativeToRoot = path.relative(path.dirname(fullPath), path.join(__dirname));
        // If we're in src/components, relativeToRoot is '../..'
        // We want to replace '@/src/' with relativeToRoot + '/src/'
        const replacement = relativeToRoot === '' ? './src/' : relativeToRoot + '/src/';
        
        content = content.replace(/@\/src\//g, replacement);
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));

// Also check root files
for (const file of ['index.tsx', 'App.tsx']) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    if (content.includes('@/src/')) {
      content = content.replace(/@\/src\//g, './src/');
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    }
  }
}
