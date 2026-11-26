import fs from 'fs';
const path = 'app/dashboard/inicio_de_pruebas/[token]/page.tsx';
let content = fs.readFileSync(path, 'utf8');
let results = [];
function replace(label, oldStr, newStr) {
  if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    results.push('OK: ' + label);
  } else {
    results.push('FAIL: ' + label);
  }
}
replace('imports',
  `import {
  Play,
  VolumeX,
  Eye,
  Heart,
  Clock,
  ArrowRight,
  AlertCircle,
  UserCheck,
  FileText,
} from 'lucide-react';`,
  `import {
  ArrowRight,
  AlertCircle,
  UserCheck,
  FileText,
} from 'lucide-react';`);
replace('props',
  `interface DemographicsFormProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;`,
  `interface DemographicsFormProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;`);
replace('component sig',
  `const DemographicsForm = memo(function DemographicsForm({
  onClose,
  onSubmit,`,
  `const DemographicsForm = memo(function DemographicsForm({
  onSubmit,`);
replace('modal wrapper',
  `  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">`,
  `  return (
    <div className="bg-white rounded-2xl p-8 shadow-2xl space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">`);
replace('buttons',
  `          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="w-1/3 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="w-2/3 py-3 bg-gradient-to-r from-[#123440] to-[#0E6433] text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {loading ? 'Registrando...' : 'Confirmar e Ir al Paso 2'}
            </button>
          </div>`,
  `          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#123440] to-[#0E6433] text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {loading ? 'Registrando...' : 'Confirmar e Iniciar Evaluaciones'}
            </button>
          </div>`);
replace('closing divs',
  `      </div>
    </div>
  );`,
  `    </div>
  );`);
replace('showModal state',
  `  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);`,
  `  const [loading, setLoading] = useState(false);`);
fs.writeFileSync(path, content, 'utf8');
console.log('Part 1 done:');
results.forEach(r => console.log(r));