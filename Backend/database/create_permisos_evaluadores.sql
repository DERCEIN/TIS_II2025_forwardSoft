-- Crear tabla permisos_evaluadores
CREATE TABLE IF NOT EXISTS permisos_evaluadores (
    id SERIAL PRIMARY KEY,
    coordinador_id INTEGER NOT NULL,
    evaluador_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    status VARCHAR(20) DEFAULT 'activo' CHECK (status IN ('activo', 'finalizado', 'pendiente', 'cancelado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coordinador_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluador_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_permisos_evaluadores_evaluador ON permisos_evaluadores(evaluador_id);
CREATE INDEX IF NOT EXISTS idx_permisos_evaluadores_coordinador ON permisos_evaluadores(coordinador_id);
CREATE INDEX IF NOT EXISTS idx_permisos_evaluadores_status ON permisos_evaluadores(status);
CREATE INDEX IF NOT EXISTS idx_permisos_evaluadores_fecha ON permisos_evaluadores(start_date);


INSERT INTO permisos_evaluadores (coordinador_id, evaluador_id, start_date, start_time, duration_days, status) 
VALUES 
(1, 2, '2024-12-01', '08:00:00', 7, 'activo'),
(1, 3, '2024-12-01', '08:00:00', 7, 'activo')
ON CONFLICT DO NOTHING;


SELECT 'Tabla permisos_evaluadores creada exitosamente' as resultado;
