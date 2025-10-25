-- Migración SEGURA para mejorar la estructura de niveles de competencia
-- Versión corregida que maneja las restricciones de clave foránea


CREATE TABLE IF NOT EXISTS niveles_competencia_backup AS 
SELECT * FROM niveles_competencia;

-- 2. Verificar datos existentes antes de la migración
SELECT 
    'ANTES DE MIGRACIÓN' as estado,
    nc.nombre as nivel,
    COUNT(ia.id) as inscripciones,
    COUNT(DISTINCT ia.olimpista_id) as olimpistas_unicos
FROM niveles_competencia nc
LEFT JOIN inscripciones_areas ia ON ia.nivel_competencia_id = nc.id
GROUP BY nc.id, nc.nombre, nc.orden_display
ORDER BY nc.orden_display;


CREATE TEMP TABLE mapeo_niveles AS
SELECT 
    o.id as olimpista_id,
    ia.id as inscripcion_id,
    o.grado_escolaridad,
    ia.nivel_competencia_id as nivel_actual
FROM olimpistas o
JOIN inscripciones_areas ia ON ia.olimpista_id = o.id;

-- 4. Insertar nuevos niveles específicos (sin eliminar los existentes)
INSERT INTO niveles_competencia (nombre, descripcion, orden_display, is_active) VALUES 
('Primaria 1ro', 'Primer grado de educación primaria', 1, true),
('Primaria 2do', 'Segundo grado de educación primaria', 2, true),
('Primaria 3ro', 'Tercer grado de educación primaria', 3, true),
('Primaria 4to', 'Cuarto grado de educación primaria', 4, true),
('Primaria 5to', 'Quinto grado de educación primaria', 5, true),
('6to Primaria', 'Sexto grado de educación primaria', 6, true),
('Secundaria 1ro', 'Primer año de educación secundaria', 7, true),
('Secundaria 2do', 'Segundo año de educación secundaria', 8, true),
('Secundaria 3ro', 'Tercer año de educación secundaria', 9, true),
('Secundaria 4to', 'Cuarto año de educación secundaria', 10, true),
('Secundaria 5to', 'Quinto año de educación secundaria', 11, true),
('Secundaria 6to', 'Sexto año de educación secundaria', 12, true);

-- 5. Actualizar inscripciones basándose en grado_escolaridad
-- Primaria 1ro-5to
UPDATE inscripciones_areas 
SET nivel_competencia_id = (
    SELECT id FROM niveles_competencia WHERE nombre = 'Primaria 1ro'
)
WHERE olimpista_id IN (
    SELECT o.id FROM olimpistas o 
    WHERE o.grado_escolaridad ILIKE '%1ro%primaria%' 
    OR o.grado_escolaridad ILIKE '%primero%primaria%'
);

UPDATE inscripciones_areas 
SET nivel_competencia_id = (
    SELECT id FROM niveles_competencia WHERE nombre = 'Primaria 2do'
)
WHERE olimpista_id IN (
    SELECT o.id FROM olimpistas o 
    WHERE o.grado_escolaridad ILIKE '%2do%primaria%' 
    OR o.grado_escolaridad ILIKE '%segundo%primaria%'
);

UPDATE inscripciones_areas 
SET nivel_competencia_id = (
    SELECT id FROM niveles_competencia WHERE nombre = 'Primaria 3ro'
)
WHERE olimpista_id IN (
    SELECT o.id FROM olimpistas o 
    WHERE o.grado_escolaridad ILIKE '%3ro%primaria%' 
    OR o.grado_escolaridad ILIKE '%tercero%primaria%'
);

UPDATE inscripciones_areas 
SET nivel_competencia_id = (
    SELECT id FROM niveles_competencia WHERE nombre = 'Primaria 4to'
)
WHERE olimpista_id IN (
    SELECT o.id FROM olimpistas o 
    WHERE o.grado_escolaridad ILIKE '%4to%primaria%' 
    OR o.grado_escolaridad ILIKE '%cuarto%primaria%'
);

UPDATE inscripciones_areas 
SET nivel_competencia_id = (
    SELECT id FROM niveles_competencia WHERE nombre = 'Primaria 5to'
)
WHERE olimpista_id IN (
    SELECT o.id FROM olimpistas o 
    WHERE o.grado_escolaridad ILIKE '%5to%primaria%' 
    OR o.grado_escolaridad ILIKE '%quinto%primaria%'
);

-- 6to Primaria
UPDATE inscripciones_areas 
SET nivel_competencia_id = (
    SELECT id FROM niveles_competencia WHERE nombre = '6to Primaria'
)
WHERE olimpista_id IN (
    SELECT o.id FROM olimpistas o 
    WHERE o.grado_escolaridad ILIKE '%6to%primaria%' 
    OR o.grado_escolaridad ILIKE '%sexto%primaria%'
);

-- Secundaria 1ro-6to
UPDATE inscripciones_areas 
SET nivel_competencia_id = (
    SELECT id FROM niveles_competencia WHERE nombre = 'Secundaria 1ro'
)
WHERE olimpista_id IN (
    SELECT o.id FROM olimpistas o 
    WHERE o.grado_escolaridad ILIKE '%1ro%secundaria%' 
    OR o.grado_escolaridad ILIKE '%primero%secundaria%'
);

UPDATE inscripciones_areas 
SET nivel_competencia_id = (
    SELECT id FROM niveles_competencia WHERE nombre = 'Secundaria 2do'
)
WHERE olimpista_id IN (
    SELECT o.id FROM olimpistas o 
    WHERE o.grado_escolaridad ILIKE '%2do%secundaria%' 
    OR o.grado_escolaridad ILIKE '%segundo%secundaria%'
);

UPDATE inscripciones_areas 
SET nivel_competencia_id = (
    SELECT id FROM niveles_competencia WHERE nombre = 'Secundaria 3ro'
)
WHERE olimpista_id IN (
    SELECT o.id FROM olimpistas o 
    WHERE o.grado_escolaridad ILIKE '%3ro%secundaria%' 
    OR o.grado_escolaridad ILIKE '%tercero%secundaria%'
);

UPDATE inscripciones_areas 
SET nivel_competencia_id = (
    SELECT id FROM niveles_competencia WHERE nombre = 'Secundaria 4to'
)
WHERE olimpista_id IN (
    SELECT o.id FROM olimpistas o 
    WHERE o.grado_escolaridad ILIKE '%4to%secundaria%' 
    OR o.grado_escolaridad ILIKE '%cuarto%secundaria%'
);

UPDATE inscripciones_areas 
SET nivel_competencia_id = (
    SELECT id FROM niveles_competencia WHERE nombre = 'Secundaria 5to'
)
WHERE olimpista_id IN (
    SELECT o.id FROM olimpistas o 
    WHERE o.grado_escolaridad ILIKE '%5to%secundaria%' 
    OR o.grado_escolaridad ILIKE '%quinto%secundaria%'
);

UPDATE inscripciones_areas 
SET nivel_competencia_id = (
    SELECT id FROM niveles_competencia WHERE nombre = 'Secundaria 6to'
)
WHERE olimpista_id IN (
    SELECT o.id FROM olimpistas o 
    WHERE o.grado_escolaridad ILIKE '%6to%secundaria%' 
    OR o.grado_escolaridad ILIKE '%sexto%secundaria%'
);

-- 6. Desactivar niveles antiguos (en lugar de eliminarlos)
UPDATE niveles_competencia 
SET is_active = false 
WHERE nombre IN ('Primaria', 'Secundaria', 'Preuniversitario');

-- 7. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_niveles_competencia_orden ON niveles_competencia(orden_display);
CREATE INDEX IF NOT EXISTS idx_niveles_competencia_activo ON niveles_competencia(is_active);
CREATE INDEX IF NOT EXISTS idx_inscripciones_nivel_especifico ON inscripciones_areas(nivel_competencia_id);

-- 8. Verificar migración exitosa
SELECT 
    'DESPUÉS DE MIGRACIÓN' as estado,
    nc.nombre as nivel,
    COUNT(ia.id) as inscripciones,
    COUNT(DISTINCT ia.olimpista_id) as olimpistas_unicos,
    nc.is_active as activo
FROM niveles_competencia nc
LEFT JOIN inscripciones_areas ia ON ia.nivel_competencia_id = nc.id
GROUP BY nc.id, nc.nombre, nc.orden_display, nc.is_active
ORDER BY nc.orden_display;

-- 9. Verificar que no hay inscripciones huérfanas
SELECT 
    'INSCRIPCIONES SIN NIVEL ASIGNADO' as estado,
    COUNT(*) as total
FROM inscripciones_areas ia
LEFT JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
WHERE nc.id IS NULL;

-- 10. Limpiar tabla temporal
DROP TABLE IF EXISTS mapeo_niveles;

