
CREATE TABLE IF NOT EXISTS configuracion_areas_evaluacion (
    id SERIAL PRIMARY KEY,
    area_competencia_id INTEGER NOT NULL,
    
    
    tiempo_evaluacion_minutos INTEGER NOT NULL DEFAULT 120,
    
   
    periodo_evaluacion_inicio TIMESTAMP NOT NULL,
    periodo_evaluacion_fin TIMESTAMP NOT NULL,
    
    
    periodo_publicacion_inicio TIMESTAMP NOT NULL,
    periodo_publicacion_fin TIMESTAMP NOT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (area_competencia_id) REFERENCES areas_competencia(id) ON DELETE CASCADE,
    UNIQUE(area_competencia_id),
    CHECK (periodo_evaluacion_inicio < periodo_evaluacion_fin),
    CHECK (periodo_publicacion_inicio < periodo_publicacion_fin),
    CHECK (periodo_evaluacion_fin <= periodo_publicacion_inicio)
);


CREATE INDEX IF NOT EXISTS idx_config_area_eval_area ON configuracion_areas_evaluacion(area_competencia_id);
CREATE INDEX IF NOT EXISTS idx_config_area_eval_periodo ON configuracion_areas_evaluacion(periodo_evaluacion_inicio, periodo_evaluacion_fin);


CREATE OR REPLACE FUNCTION update_config_area_eval_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_config_area_eval_updated_at 
    BEFORE UPDATE ON configuracion_areas_evaluacion
    FOR EACH ROW EXECUTE FUNCTION update_config_area_eval_updated_at();


INSERT INTO configuracion_areas_evaluacion (
    area_competencia_id,
    tiempo_evaluacion_minutos,
    periodo_evaluacion_inicio,
    periodo_evaluacion_fin,
    periodo_publicacion_inicio,
    periodo_publicacion_fin
)
SELECT 
    ac.id,
    120, -- Tiempo por defecto de 120 minutos
    COALESCE(
        (SELECT clasificacion_fecha_inicio FROM configuracion_olimpiada ORDER BY id DESC LIMIT 1),
        CURRENT_TIMESTAMP
    ),
    COALESCE(
        (SELECT clasificacion_fecha_fin FROM configuracion_olimpiada ORDER BY id DESC LIMIT 1),
        CURRENT_TIMESTAMP + INTERVAL '7 days'
    ),
    COALESCE(
        (SELECT clasificacion_fecha_fin FROM configuracion_olimpiada ORDER BY id DESC LIMIT 1),
        CURRENT_TIMESTAMP + INTERVAL '7 days'
    ),
    COALESCE(
        (SELECT clasificacion_fecha_fin FROM configuracion_olimpiada ORDER BY id DESC LIMIT 1) + INTERVAL '1 day',
        CURRENT_TIMESTAMP + INTERVAL '8 days'
    )
FROM areas_competencia ac
WHERE ac.is_active = true
ON CONFLICT (area_competencia_id) DO NOTHING;

SELECT 'Tabla configuracion_areas_evaluacion creada exitosamente' as resultado;

