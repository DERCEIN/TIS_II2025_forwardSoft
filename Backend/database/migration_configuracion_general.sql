-- Migración para configuración general de la olimpiada con fases de clasificación y final
-- Esta tabla almacena la configuración de fechas y tiempos de evaluación

CREATE TABLE IF NOT EXISTS configuracion_olimpiada (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL DEFAULT 'Olimpiada Oh! SanSi',
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE,
    
    -- Fechas generales de la olimpiada
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    
    -- Configuración de la fase de clasificación
    clasificacion_fecha_inicio TIMESTAMP,
    clasificacion_fecha_fin TIMESTAMP,
    clasificacion_puntuacion_minima DECIMAL(5,2) DEFAULT 51.00,
    clasificacion_puntuacion_maxima DECIMAL(5,2) DEFAULT 100.00,
    
    -- Configuración de la fase final
    final_fecha_inicio TIMESTAMP,
    final_fecha_fin TIMESTAMP,
    final_puntuacion_minima DECIMAL(5,2) DEFAULT 0.00,
    final_puntuacion_maxima DECIMAL(5,2) DEFAULT 100.00,
    
    -- Tiempo de evaluación (en minutos)
    tiempo_evaluacion INTEGER DEFAULT 120,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuración inicial
INSERT INTO configuracion_olimpiada (
    nombre,
    descripcion,
    estado,
    fecha_inicio,
    fecha_fin,
    clasificacion_fecha_inicio,
    clasificacion_fecha_fin,
    clasificacion_puntuacion_minima,
    clasificacion_puntuacion_maxima,
    final_fecha_inicio,
    final_fecha_fin,
    final_puntuacion_minima,
    final_puntuacion_maxima,
    tiempo_evaluacion
) VALUES (
    'Olimpiada Oh! SanSi',
    'Olimpiada en Ciencias y Tecnología de la Universidad Mayor de San Simón',
    TRUE,
    '2025-01-01',
    '2025-12-31',
    '2025-05-31 08:00:00',
    '2025-05-31 18:00:00',
    51.00,
    100.00,
    '2025-07-11 08:00:00',
    '2025-07-11 18:00:00',
    0.00,
    100.00,
    120
) ON CONFLICT DO NOTHING;

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_configuracion_olimpiada_updated_at BEFORE UPDATE ON configuracion_olimpiada
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


