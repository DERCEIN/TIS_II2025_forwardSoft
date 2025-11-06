
UPDATE inscripciones_areas ia
SET estado = 'no_clasificado'
WHERE ia.estado NOT IN ('desclasificado', 'no_clasificado')
AND EXISTS (
    SELECT 1 
    FROM evaluaciones_clasificacion ec
    WHERE ec.inscripcion_area_id = ia.id
    AND ec.puntuacion < 51
    AND ec.puntuacion >= 0
)
AND NOT EXISTS (
    SELECT 1 
    FROM desclasificaciones d
    WHERE d.inscripcion_area_id = ia.id
    AND d.estado = 'activa'
);


DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'inscripciones_areas' 
        AND column_name = 'updated_at'
    ) THEN
        UPDATE inscripciones_areas ia
        SET updated_at = CURRENT_TIMESTAMP
        WHERE ia.estado = 'no_clasificado'
        AND EXISTS (
            SELECT 1 
            FROM evaluaciones_clasificacion ec
            WHERE ec.inscripcion_area_id = ia.id
            AND ec.puntuacion < 51
        );
    END IF;
END $$;


INSERT INTO no_clasificados (inscripcion_area_id, puntuacion, puntuacion_minima_requerida, motivo, evaluador_id, fase)
SELECT 
    ec.inscripcion_area_id,
    ec.puntuacion,
    51.0 as puntuacion_minima_requerida,
    'Puntuación ' || ec.puntuacion || ' menor a la mínima requerida de 51 puntos (actualización automática)',
    ec.evaluador_id,
    'clasificacion'
FROM evaluaciones_clasificacion ec
JOIN inscripciones_areas ia ON ia.id = ec.inscripcion_area_id
WHERE ec.puntuacion < 51
AND ec.puntuacion >= 0
AND ia.estado = 'no_clasificado'
AND NOT EXISTS (
    SELECT 1 
    FROM no_clasificados nc
    WHERE nc.inscripcion_area_id = ec.inscripcion_area_id
    AND nc.fase = 'clasificacion'
)
AND NOT EXISTS (
    SELECT 1 
    FROM desclasificaciones d
    WHERE d.inscripcion_area_id = ec.inscripcion_area_id
    AND d.estado = 'activa'
)
ON CONFLICT (inscripcion_area_id, fase) DO NOTHING;


SELECT 
    'Participantes actualizados a no_clasificado' as descripcion,
    COUNT(*) as total
FROM inscripciones_areas
WHERE estado = 'no_clasificado';

SELECT 
    'Registros en tabla no_clasificados' as descripcion,
    COUNT(*) as total
FROM no_clasificados
WHERE fase = 'clasificacion';

