const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('d:/study/Senior/Project/All/web-admin/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace gray with slate for a premium cooler tone
  content = content.replace(/\b(bg|text|border|ring|fill|stroke|from|to|via|hover:bg|hover:text|hover:border|shadow)-gray-([0-9]{2,3})\b/g, '$1-slate-$2');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
});
console.log('done');
