
ALTER TABLE IF EXISTS descalificaciones RENAME TO desclasificaciones;
ALTER TABLE IF EXISTS reglas_descalificacion RENAME TO reglas_desclasificacion;


ALTER TABLE desclasificaciones 
    RENAME COLUMN regla_descalificacion_id TO regla_desclasificacion_id;

ALTER TABLE desclasificaciones 
    RENAME COLUMN fecha_descalificacion TO fecha_desclasificacion;


ALTER TABLE desclasificaciones
    DROP CONSTRAINT IF EXISTS descalificaciones_regla_descalificacion_id_fkey;

ALTER TABLE desclasificaciones
    ADD CONSTRAINT desclasificaciones_regla_desclasificacion_id_fkey
    FOREIGN KEY (regla_desclasificacion_id) REFERENCES reglas_desclasificacion(id) ON DELETE RESTRICT;


DROP INDEX IF EXISTS idx_descalificaciones_inscripcion;
DROP INDEX IF EXISTS idx_descalificaciones_regla;
DROP INDEX IF EXISTS idx_descalificaciones_fecha;
DROP INDEX IF EXISTS idx_descalificaciones_estado;
DROP INDEX IF EXISTS idx_reglas_descalificacion_area;
DROP INDEX IF EXISTS idx_reglas_descalificacion_tipo;
DROP INDEX IF EXISTS idx_reglas_descalificacion_activa;

CREATE INDEX IF NOT EXISTS idx_desclasificaciones_inscripcion ON desclasificaciones(inscripcion_area_id);
CREATE INDEX IF NOT EXISTS idx_desclasificaciones_regla ON desclasificaciones(regla_desclasificacion_id);
CREATE INDEX IF NOT EXISTS idx_desclasificaciones_fecha ON desclasificaciones(fecha_desclasificacion);
CREATE INDEX IF NOT EXISTS idx_desclasificaciones_estado ON desclasificaciones(estado);
CREATE INDEX IF NOT EXISTS idx_reglas_desclasificacion_area ON reglas_desclasificacion(area_competencia_id);
CREATE INDEX IF NOT EXISTS idx_reglas_desclasificacion_tipo ON reglas_desclasificacion(tipo);
CREATE INDEX IF NOT EXISTS idx_reglas_desclasificacion_activa ON reglas_desclasificacion(activa);


UPDATE inscripciones_areas 
SET estado = 'desclasificado' 
WHERE estado = 'descalificado';

