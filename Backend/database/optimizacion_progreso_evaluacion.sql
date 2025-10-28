-- Optimización de queries para progreso de evaluación clasificatoria
-- Este script mejora el rendimiento de las consultas del dashboard de coordinador

-- Índices para inscripciones_areas
CREATE INDEX IF NOT EXISTS idx_inscripciones_areas_area_nivel ON inscripciones_areas(area_competencia_id, nivel_competencia_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_areas_estado_area ON inscripciones_areas(estado, area_competencia_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_areas_created_at ON inscripciones_areas(created_at);

-- Índices para evaluaciones_clasificacion
CREATE INDEX IF NOT EXISTS idx_eval_clas_inscripcion_fecha ON evaluaciones_clasificacion(inscripcion_area_id, fecha_evaluacion);
CREATE INDEX IF NOT EXISTS idx_eval_clas_evaluador_fecha ON evaluaciones_clasificacion(evaluador_id, fecha_evaluacion);
CREATE INDEX IF NOT EXISTS idx_eval_clas_puntuacion ON evaluaciones_clasificacion(puntuacion);

-- Índices para asignaciones_evaluacion
CREATE INDEX IF NOT EXISTS idx_asignaciones_evaluador_fase ON asignaciones_evaluacion(evaluador_id, fase);
CREATE INDEX IF NOT EXISTS idx_asignaciones_inscripcion ON asignaciones_evaluacion(inscripcion_area_id);

-- Índices para descalificaciones
CREATE INDEX IF NOT EXISTS idx_descalificaciones_fecha ON descalificaciones(fecha_descalificacion);
CREATE INDEX IF NOT EXISTS idx_descalificaciones_regla ON descalificaciones(regla_descalificacion_id);
CREATE INDEX IF NOT EXISTS idx_descalificaciones_evaluador ON descalificaciones(evaluador_id);

-- Índices para users (evaluadores)
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);

-- Índices para evaluadores_areas
CREATE INDEX IF NOT EXISTS idx_evaluadores_areas_area_active ON evaluadores_areas(area_competencia_id, is_active);
CREATE INDEX IF NOT EXISTS idx_evaluadores_areas_user_active ON evaluadores_areas(user_id, is_active);

-- Índices para responsables_academicos
CREATE INDEX IF NOT EXISTS idx_responsables_user_active ON responsables_academicos(user_id, is_active);

-- Índices compuestos para consultas complejas
CREATE INDEX IF NOT EXISTS idx_inscripciones_completo ON inscripciones_areas(area_competencia_id, estado, created_at);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_completo ON evaluaciones_clasificacion(inscripcion_area_id, evaluador_id, fecha_evaluacion);

-- Estadísticas de tablas para optimización del planificador
ANALYZE inscripciones_areas;
ANALYZE evaluaciones_clasificacion;
ANALYZE asignaciones_evaluacion;
ANALYZE descalificaciones;
ANALYZE users;
ANALYZE evaluadores_areas;
ANALYZE responsables_academicos;

-- Comentarios sobre optimizaciones aplicadas:
-- 1. Índices compuestos para consultas que filtran por múltiples columnas
-- 2. Índices en fechas para consultas temporales
-- 3. Índices en estados para filtros rápidos
-- 4. Estadísticas actualizadas para mejor planificación de queries
