
CREATE TABLE IF NOT EXISTS cierre_fase_areas (
    id SERIAL PRIMARY KEY,
    area_competencia_id INTEGER NOT NULL,
    nivel_competencia_id INTEGER NULL, 
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'activa', 'cerrada')) DEFAULT 'pendiente',
    porcentaje_completitud DECIMAL(5,2) DEFAULT 0.00 CHECK (porcentaje_completitud >= 0 AND porcentaje_completitud <= 100),
    cantidad_clasificados INTEGER DEFAULT 0,
    fecha_cierre TIMESTAMP NULL,
    coordinador_id INTEGER NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (area_competencia_id) REFERENCES areas_competencia(id) ON DELETE CASCADE,
    FOREIGN KEY (nivel_competencia_id) REFERENCES niveles_competencia(id) ON DELETE SET NULL,
    FOREIGN KEY (coordinador_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(area_competencia_id, nivel_competencia_id)
);


CREATE TABLE IF NOT EXISTS cierre_fase_general (
    id SERIAL PRIMARY KEY,
    fase VARCHAR(20) CHECK (fase IN ('clasificacion', 'final')) DEFAULT 'clasificacion',
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'activa', 'cerrada_general', 'cerrada_automatica')) DEFAULT 'pendiente',
    fecha_inicio TIMESTAMP NULL,
    fecha_fin_original TIMESTAMP NULL,
    fecha_fin_extendida TIMESTAMP NULL,
    justificacion_extension TEXT NULL,
    usuario_extension_id INTEGER NULL,
    fecha_extension TIMESTAMP NULL,
    fecha_cierre TIMESTAMP NULL,
    usuario_cierre_id INTEGER NULL,
    areas_cerradas INTEGER DEFAULT 0,
    areas_pendientes INTEGER DEFAULT 0,
    clasificados_migrados INTEGER DEFAULT 0,
    no_clasificados_excluidos INTEGER DEFAULT 0,
    desclasificados_excluidos INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (usuario_extension_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_cierre_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(fase)
);


CREATE INDEX IF NOT EXISTS idx_cierre_fase_areas_area ON cierre_fase_areas(area_competencia_id);
CREATE INDEX IF NOT EXISTS idx_cierre_fase_areas_estado ON cierre_fase_areas(estado);
CREATE INDEX IF NOT EXISTS idx_cierre_fase_general_fase ON cierre_fase_general(fase);
CREATE INDEX IF NOT EXISTS idx_cierre_fase_general_estado ON cierre_fase_general(estado);


COMMENT ON TABLE cierre_fase_areas IS 'Rastrea el estado de cierre de fase clasificatoria por área';
COMMENT ON TABLE cierre_fase_general IS 'Rastrea el estado de cierre de fase clasificatoria general del sistema';
COMMENT ON COLUMN cierre_fase_general.fecha_fin_extendida IS 'Fecha de fin extendida si se modificó la fecha original';
COMMENT ON COLUMN cierre_fase_general.estado IS 'Estado: pendiente, activa, cerrada_general (manual), cerrada_automatica (por fecha)';

