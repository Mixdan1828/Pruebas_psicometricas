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
replace('token cleanup effect',
  `    validateTokenOnLoad();
  }, [token]);

  const loadCandidateTests`,
  `    validateTokenOnLoad();
  }, [token]);

  // Limpieza de localStorage si el token cambió
  // Evita que un candidate_id de una liga previa contamine la consulta a la API
  useEffect(() => {
    if (typeof localStorage === 'undefined' || !token) return;
    const tokenGuardado = localStorage.getItem('token_actual');
    if (tokenGuardado && tokenGuardado !== token) {
      localStorage.removeItem('candidato_id');
      localStorage.removeItem('candidato_nombre');
      localStorage.removeItem('candidato_apellido_paterno');
      localStorage.removeItem('candidato_apellido_materno');
      localStorage.removeItem('token_actual');
      const watchedKey = 'videos_instructions_watched_' + token;
      localStorage.removeItem(watchedKey);
    }
  }, [token]);

  const loadCandidateTests`);
replace('loadCandidateTests URL',
  `      const urlParams = new URLSearchParams();
      urlParams.set('token', token);
      if (candidateId) {
        urlParams.set('candidate_id', candidateId);
      }`,
  `      const urlParams = new URLSearchParams();
      urlParams.set('token', token);`);
replace('loadCandidateTests deps',
  `  }, [token, candidateId]);

  useEffect(() => {
    loadCandidateTests();
  }, [loadCandidateTests]);`,
  `  }, [token]);

  useEffect(() => {
    loadCandidateTests();
  }, [loadCandidateTests]);`);
replace('registration phase',
  `                <button
                  onClick={() => setShowModal(true)}
                  className="w-full py-4 bg-[#123440] text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-[#001e28] transition-all shadow-lg shadow-[#123440]/10 cursor-pointer"
                >
                  <span>Completar Registro</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </aside>
          </section>
        </main>

        {showModal && (
          <DemographicsForm
            onClose={() => setShowModal(false)}
            onSubmit={handleStartTest}
            formData={formData}
            handleInputChange={handleInputChange}
            loading={loading}
            errorMessage={errorMessage}
            terminosAceptados={terminosAceptados}
            setTerminosAceptados={setTerminosAceptados}
          />
        )}
      </div>
    );`,
  `              <DemographicsForm
                onSubmit={handleStartTest}
                formData={formData}
                handleInputChange={handleInputChange}
                loading={loading}
                errorMessage={errorMessage}
                terminosAceptados={terminosAceptados}
                setTerminosAceptados={setTerminosAceptados}
              />
            </div>
          </section>
        </main>
      </div>
    );`);
replace('handleStartTest deps',
  `  }, [formData, linkInfo, token, terminosAceptados, setPhase]);`,
  `  }, [formData, linkInfo, token, terminosAceptados]);`);
fs.writeFileSync(path, content, 'utf8');
console.log('Part 2 done:');
results.forEach(r => console.log(r));
console.log('File length:', content.length);