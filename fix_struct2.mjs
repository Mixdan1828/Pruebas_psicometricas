import fs from 'fs';
const path = 'app/dashboard/inicio_de_pruebas/[token]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldStr = '</div>\n\n            <aside className="lg:col-span-4 space-y-6">';
const newStr = '<aside className="lg:col-span-4 space-y-6">';

const idx = content.indexOf(oldStr);
console.log('Found at:', idx);

if (idx >= 0) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed!');
} else {
  console.log('Not found');
  const lines = content.split('\n');
  for (let i = 504; i <= 510 && i < lines.length; i++) {
    console.log((i+1) + ': ' + JSON.stringify(lines[i]));
  }
}