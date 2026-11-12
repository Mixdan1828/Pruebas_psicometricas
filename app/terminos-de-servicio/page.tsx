// app/terminos-de-servicio/page.tsx
export default function TerminosServicioPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-slate-800 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold text-[#416912] uppercase tracking-wider">Legal</span>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0d313f] mt-1">
          Términos y Condiciones de Uso y Política de Privacidad
        </h1>
        <p className="text-xs text-slate-500 mt-1">Última actualización: Noviembre de 2026</p>
      </div>

      <section className="space-y-3 text-sm md:text-base text-justify">
        <h2 className="font-bold text-[#0d313f] text-lg mt-4">1. Identificación del Titular y la Plataforma</h2>
        <p>
          El presente documento regula el acceso, navegación y uso del sitio web y plataforma digital <strong>Pruebas Psicométricas</strong> (en adelante, la <em>Plataforma</em>), operada y titularidad de la <strong>Fundación Doctor Hernández Zurita, I.B.P.</strong> (en adelante, el <em>Titular</em>), institución de beneficencia privada legalmente constituida. Al acceder a la Plataforma y utilizar nuestros servicios, el usuario acepta de manera expresa y sin reservas los términos estipulados en este documento.
        </p>

        <h2 className="font-bold text-[#0d313f] text-lg mt-4">2. Políticas de Acceso y Navegación</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Acceso Autorizado:</strong> El acceso a los cuestionarios y evaluaciones psicométricas (tales como NOM-035, Terman, Claver, Raven, entre otros) está restringido a candidatos, usuarios y evaluadores autorizados mediante credenciales de acceso, enlaces únicos o códigos asignados por el Titular o por administradores de recursos humanos autorizados.</li>
          <li><strong>Uso Adecuado:</strong> El usuario se compromete a hacer un uso lícito, diligente y correcto de la Plataforma, absteniéndose de utilizarla para realizar prácticas fraudulentas, suplantación de identidad, alterar los sistemas informáticos o intentar extraer información confidencial de terceros.</li>
          <li><strong>Requisito de Aceptación:</strong> Para iniciar cualquier test o evaluación dentro de la Plataforma, es un requisito indispensable que el usuario lea y marque la casilla de aceptación de estos Términos y Condiciones y de la Política de Privacidad.</li>
        </ul>

        <h2 className="font-bold text-[#0d313f] text-lg mt-4">3. Protección de Datos y Privacidad</h2>
        <p>
          De conformidad con la legislación aplicable en materia de protección de datos personales, el Titular informa que los datos recabados (incluyendo nombre completo, sexo, fecha de nacimiento, edad, respuestas y resultados) serán utilizados exclusivamente con fines de evaluación laboral, selección de personal, cumplimiento normativo (como la NOM-035-STPS) y análisis estadísticos internos, bajo estrictos estándares de confidencialidad.
        </p>

        <h2 className="font-bold text-[#0d313f] text-lg mt-4">4. Propiedad Intelectual y Enlaces Externos</h2>
        <p>
          Todos los contenidos, interfaces, reactivos de las pruebas psicométricas, logotipos (incluyendo el imagotipo de la Fundación Doctor Hernández Zurita, I.B.P.), diseños, código fuente y bases de datos son propiedad exclusiva del Titular. Queda prohibida su reproducción o comercialización sin autorización. Asimismo, el Titular no asume responsabilidad por los contenidos o políticas de sitios web externos enlazados.
        </p>

        <h2 className="font-bold text-[#0d313f] text-lg mt-4">5. Legislación y Jurisdicción Aplicable</h2>
        <p>
          Para la interpretación y cumplimiento de los presentes Términos y Condiciones, las partes se someten expresamente a las leyes vigentes y a los tribunales competentes de los Estados Unidos Mexicanos correspondientes a la ubicación del Titular.
        </p>
      </section>

      <div className="pt-6 border-t border-slate-200">
        <a
          href="javascript:window.close();"
          className="inline-block px-4 py-2 bg-[#0d313f] text-white rounded-lg text-sm font-semibold hover:bg-[#164a5c] transition-colors"
        >
          Cerrar ventana
        </a>
      </div>
    </div>
  );
}