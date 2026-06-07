const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<ScrollView')) {
    // Regex matches <ScrollView followed by any space/props but WITHOUT keyboardShouldPersistTaps
    let newContent = content.replace(/<\s*ScrollView(?!\s+[^>]*keyboardShouldPersistTaps)/g, '<ScrollView keyboardShouldPersistTaps="handled"');
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      changedFiles++;
      console.log('Updated: ' + file);
    }
  }
});

console.log('Total files updated: ' + changedFiles);
