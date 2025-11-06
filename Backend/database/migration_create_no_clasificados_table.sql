
CREATE TABLE IF NOT EXISTS no_clasificados (
    id SERIAL PRIMARY KEY,
    inscripcion_area_id INTEGER NOT NULL,
    puntuacion DECIMAL(5,2) NOT NULL,
    puntuacion_minima_requerida DECIMAL(5,2) NOT NULL,
    motivo TEXT,
    evaluador_id INTEGER NULL,
    fase VARCHAR(20) DEFAULT 'clasificacion' CHECK (fase IN ('clasificacion', 'final')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (inscripcion_area_id) REFERENCES inscripciones_areas(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluador_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(inscripcion_area_id, fase)
);


CREATE INDEX IF NOT EXISTS idx_no_clasificados_inscripcion ON no_clasificados(inscripcion_area_id);
CREATE INDEX IF NOT EXISTS idx_no_clasificados_evaluador ON no_clasificados(evaluador_id);
CREATE INDEX IF NOT EXISTS idx_no_clasificados_fase ON no_clasificados(fase);
CREATE INDEX IF NOT EXISTS idx_no_clasificados_puntuacion ON no_clasificados(puntuacion);
CREATE INDEX IF NOT EXISTS idx_no_clasificados_created_at ON no_clasificados(created_at);


COMMENT ON TABLE no_clasificados IS 'Registra participantes que no clasificaron por puntuación baja';
COMMENT ON COLUMN no_clasificados.puntuacion IS 'Puntuación obtenida por el participante';
COMMENT ON COLUMN no_clasificados.puntuacion_minima_requerida IS 'Puntuación mínima requerida para clasificar';
COMMENT ON COLUMN no_clasificados.motivo IS 'Motivo adicional de no clasificación (opcional)';
COMMENT ON COLUMN no_clasificados.fase IS 'Fase en la que no clasificó (clasificacion )';

