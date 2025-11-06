
CREATE TABLE IF NOT EXISTS reglas_desclasificacion (
    id SERIAL PRIMARY KEY,
    area_competencia_id INTEGER NOT NULL,
    nombre_regla VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('fraude', 'puntuacion', 'comportamiento', 'tecnico')),
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (area_competencia_id) REFERENCES areas_competencia(id) ON DELETE CASCADE,
    UNIQUE(area_competencia_id, nombre_regla, tipo)
);


CREATE INDEX IF NOT EXISTS idx_reglas_desclasificacion_area ON reglas_desclasificacion(area_competencia_id);
CREATE INDEX IF NOT EXISTS idx_reglas_desclasificacion_tipo ON reglas_desclasificacion(tipo);
CREATE INDEX IF NOT EXISTS idx_reglas_desclasificacion_activa ON reglas_desclasificacion(activa);


INSERT INTO reglas_desclasificacion (area_competencia_id, nombre_regla, descripcion, tipo) VALUES
-- Reglas para Informática
((SELECT id FROM areas_competencia WHERE nombre = 'Informática'), 
 'Uso de código ajeno', 
 'Usar, enviar o copiar código que no sea propio (incluyendo código de otros competidores o código generado por IA)', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Informática'), 
 'Programas ilegales', 
 'Intentar enviar programas ilegales que usen librerías de acceso a red, lean archivos que comprometan el sistema operativo, o proporcionen acceso a información sobre los problemas y sus soluciones', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Informática'), 
 'Acceso no autorizado', 
 'Intentar obtener acceso a niveles superiores (superusuario, comité evaluador, etc.) o cualquier otra cuenta no asignada', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Informática'), 
 'Almacenamiento no autorizado', 
 'Intentar almacenar información en cualquier lugar del sistema de archivos, excepto en el escritorio, directorio home de su cuenta o directorio temporal (/temp)', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Informática'), 
 'Acceso a otros equipos', 
 'Tocar o acceder a otras computadoras y sus accesorios, excepto la asignada', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Informática'), 
 'Acceso de red no autorizado', 
 'Intentar acceder a otras máquinas/dispositivos en la red o internet, excepto lo requerido para enviar su solución al sistema de evaluación', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Informática'), 
 'Alteración del sistema', 
 'Intentar reiniciar o alterar la secuencia de arranque y configuración de la computadora asignada', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Informática'), 
 'Comunicación no autorizada', 
 'Comunicarse con otras personas durante la competencia, excepto personal asignado del Comité de Competencia y/o miembros del Comité Científico', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Informática'), 
 'Dispositivos prohibidos', 
 'Traer dispositivos de almacenamiento electrónico y/o transmisión de datos a la competencia, ni ningún tipo de material impreso', 
 'fraude'),

-- Reglas comunes para todas las áreas
((SELECT id FROM areas_competencia WHERE nombre = 'Informática'), 
 'Puntuación mínima', 
 'Obtener una puntuación menor a 51 puntos en la evaluación', 
 'puntuacion'),

((SELECT id FROM areas_competencia WHERE nombre = 'Química'), 
 'Puntuación mínima', 
 'Obtener una puntuación menor a 51 puntos en la evaluación', 
 'puntuacion'),

((SELECT id FROM areas_competencia WHERE nombre = 'Matemáticas'), 
 'Puntuación mínima', 
 'Obtener una puntuación menor a 51 puntos en la evaluación', 
 'puntuacion'),

((SELECT id FROM areas_competencia WHERE nombre = 'Física'), 
 'Puntuación mínima', 
 'Obtener una puntuación menor a 51 puntos en la evaluación', 
 'puntuacion'),

-- Reglas de comportamiento para todas las áreas
((SELECT id FROM areas_competencia WHERE nombre = 'Informática'), 
 'Comportamiento inapropiado', 
 'Mostrar conducta inapropiada, irrespetuosa o disruptiva durante la competencia', 
 'comportamiento'),

((SELECT id FROM areas_competencia WHERE nombre = 'Química'), 
 'Comportamiento inapropiado', 
 'Mostrar conducta inapropiada, irrespetuosa o disruptiva durante la competencia', 
 'comportamiento'),

((SELECT id FROM areas_competencia WHERE nombre = 'Matemáticas'), 
 'Comportamiento inapropiado', 
 'Mostrar conducta inapropiada, irrespetuosa o disruptiva durante la competencia', 
 'comportamiento'),

((SELECT id FROM areas_competencia WHERE nombre = 'Física'), 
 'Comportamiento inapropiado', 
 'Mostrar conducta inapropiada, irrespetuosa o disruptiva durante la competencia', 
 'comportamiento'),

-- Reglas de comunicación para todas las áreas
((SELECT id FROM areas_competencia WHERE nombre = 'Informática'), 
 'Comunicación prohibida', 
 'Comunicarse con otros participantes, usar dispositivos de comunicación o recibir ayuda externa durante la competencia', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Química'), 
 'Comunicación prohibida', 
 'Comunicarse con otros participantes, usar dispositivos de comunicación o recibir ayuda externa durante la competencia', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Matemáticas'), 
 'Comunicación prohibida', 
 'Comunicarse con otros participantes, usar dispositivos de comunicación o recibir ayuda externa durante la competencia', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Física'), 
 'Comunicación prohibida', 
 'Comunicarse con otros participantes, usar dispositivos de comunicación o recibir ayuda externa durante la competencia', 
 'fraude'),

-- Reglas de materiales para todas las áreas
((SELECT id FROM areas_competencia WHERE nombre = 'Informática'), 
 'Materiales prohibidos', 
 'Usar materiales, dispositivos o recursos no autorizados durante la competencia', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Química'), 
 'Materiales prohibidos', 
 'Usar materiales, dispositivos o recursos no autorizados durante la competencia', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Matemáticas'), 
 'Materiales prohibidos', 
 'Usar materiales, dispositivos o recursos no autorizados durante la competencia', 
 'fraude'),

((SELECT id FROM areas_competencia WHERE nombre = 'Física'), 
 'Materiales prohibidos', 
 'Usar materiales, dispositivos o recursos no autorizados durante la competencia', 
 'fraude'),

-- Reglas técnicas específicas por área
((SELECT id FROM areas_competencia WHERE nombre = 'Química'), 
 'Manipulación de reactivos', 
 'Manipular reactivos químicos de manera peligrosa o no autorizada', 
 'tecnico'),

((SELECT id FROM areas_competencia WHERE nombre = 'Química'), 
 'Equipos de laboratorio', 
 'Usar equipos de laboratorio de manera incorrecta o peligrosa', 
 'tecnico'),

((SELECT id FROM areas_competencia WHERE nombre = 'Física'), 
 'Equipos de medición', 
 'Manipular equipos de medición física de manera incorrecta o peligrosa', 
 'tecnico'),

((SELECT id FROM areas_competencia WHERE nombre = 'Matemáticas'), 
 'Uso de calculadoras', 
 'Usar calculadoras o dispositivos de cálculo no autorizados', 
 'tecnico');


CREATE TABLE IF NOT EXISTS desclasificaciones (
    id SERIAL PRIMARY KEY,
    inscripcion_area_id INTEGER NOT NULL,
    regla_desclasificacion_id INTEGER NOT NULL,
    motivo TEXT NOT NULL,
    fecha_desclasificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    evaluador_id INTEGER,
    coordinador_id INTEGER,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'revocada')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (inscripcion_area_id) REFERENCES inscripciones_areas(id) ON DELETE CASCADE,
    FOREIGN KEY (regla_desclasificacion_id) REFERENCES reglas_desclasificacion(id) ON DELETE RESTRICT,
    FOREIGN KEY (evaluador_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (coordinador_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_desclasificaciones_inscripcion ON desclasificaciones(inscripcion_area_id);
CREATE INDEX IF NOT EXISTS idx_desclasificaciones_regla ON desclasificaciones(regla_desclasificacion_id);
CREATE INDEX IF NOT EXISTS idx_desclasificaciones_fecha ON desclasificaciones(fecha_desclasificacion);
CREATE INDEX IF NOT EXISTS idx_desclasificaciones_estado ON desclasificaciones(estado);
