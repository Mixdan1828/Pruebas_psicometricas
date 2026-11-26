import fs from 'fs';
const path = 'app/dashboard/inicio_de_pruebas/[token]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove the extra </div> at line 507
const oldBlock = `            </div>

            <aside className="lg:col-span-4 space-y-6">`;
const newBlock = `            </aside className="lg:col-span-4 space-y-6">`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(path, content, 'utf8');
  console.log('OK: structure fixed');
} else {
  console.log('FAIL: block not found');
  // Show what's around line 505-510
  const lines = content.split('\n');
  for (let i = 504; i <= 510 && i < lines.length; i++) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}