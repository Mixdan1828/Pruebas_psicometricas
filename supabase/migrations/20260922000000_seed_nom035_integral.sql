-- ============================================================================
-- Nuevo test unificado: NOM-035-STPS-2018 (Evaluación Integral)
--
-- La página "Asignar prueba" carga el catálogo de forma dinámica desde
-- public.tests (select * + .map()). Por lo tanto, con insertar este registro
-- la nueva Card aparece automáticamente con su descripción, categoría, tiempo
-- y los badges (Preguntas / Minutos / Guías) derivados desde `config_json`.
--
-- Observaciones:
--  * `type` queda como 'nom-035-integral' (uuid autogenerado en `id`).
--  * Los 137 reactivos deben cargarse en `test_questions` con el test_id
--    resultante de este INSERT (ver nota al final).
-- ============================================================================

insert into public.tests (name, description, category, type, tiempo, config_json)
values (
  'NOM-035-STPS-2018 (Evaluación Integral)',
  'Evaluación integral que abarca Acontecimientos Traumáticos Severos, Factores de Riesgo Psicosocial y Entorno Organizacional.',
  'Normatividad NOM-035',
  'nom-035-integral',
  60,
  jsonb_build_object(
    'totalItems', 137,
    'tags', jsonb_build_array('Guías I, II y III')
  )
)
on conflict (name) do nothing;