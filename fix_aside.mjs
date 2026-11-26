import fs from 'fs';
const path = 'app/dashboard/inicio_de_pruebas/[token]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-[#123440]">Información requerida</h2>
                <p className="text-sm text-slate-600">
                  Todos los campos son obligatorios por requerimiento institucional.
                </p>

              <DemographicsForm
                onSubmit={handleStartTest}
                formData={formData}
                handleInputChange={handleInputChange}
                loading={loading}
                errorMessage={errorMessage}
                terminosAceptados={terminosAceptados}
                setTerminosAceptados={setTerminosAceptados}
              />
            </div>
          </section>`;

const newBlock = `            </div>

            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-[#123440]">Información requerida</h2>
                <p className="text-sm text-slate-600">
                  Todos los campos son obligatorios por requerimiento institucional.
                </p>
              </div>
            </aside>

            <div className="lg:col-span-8 mt-8 lg:mt-0 space-y-6">
              <DemographicsForm
                onSubmit={handleStartTest}
                formData={formData}
                handleInputChange={handleInputChange}
                loading={loading}
                errorMessage={errorMessage}
                terminosAceptados={terminosAceptados}
                setTerminosAceptados={setTerminosAceptados}
              />
            </div>
          </section>`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(path, content, 'utf8');
  console.log('OK: aside structure fixed');
} else {
  console.log('FAIL: aside block not found');
  // Debug
  const idx = content.indexOf('<aside className="lg:col-span-4');
  if (idx >= 0) {
    console.log('Found aside at', idx);
    console.log(JSON.stringify(content.substring(idx, idx + 300)));
  }
}