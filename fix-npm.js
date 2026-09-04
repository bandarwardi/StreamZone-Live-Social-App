const fs = require('fs');
const path = require('path');

function replacePnpmSyntax(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules') continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replacePnpmSyntax(fullPath);
    } else if (file === 'package.json') {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      if (content.includes('"workspace:*"')) {
        content = content.replace(/"workspace:\*"/g, '"*"');
        changed = true;
      }
      if (content.includes('"catalog:"')) {
        content = content.replace(/"catalog:"/g, '"*"');
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}
replacePnpmSyntax('.');
