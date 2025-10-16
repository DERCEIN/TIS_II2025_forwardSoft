-- Base de datos para Sistema de Evaluación de Olimpiadas ForwardSoft
-- Compatible con PHP 7.4.22 y 8.2
-- PostgreSQL 15.10

-- Crear base de datos (ejecutar como superusuario)
-- CREATE DATABASE forwardsoft_olimpiadas WITH ENCODING 'UTF8' LC_COLLATE='es_ES.UTF-8' LC_CTYPE='es_ES.UTF-8';

-- Conectar a la base de datos
-- \c forwardsoft_olimpiadas;

-- ==============================================
-- TABLAS DE USUARIOS Y ROLES
-- ==============================================

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'coordinador', 'evaluador', 'responsable_academico')) NOT NULL DEFAULT 'evaluador',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    avatar_url VARCHAR(255) NULL
);

-- Nota: si ya tienes la base de datos creada, ejecuta también la migración manual:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) NULL;

-- Tabla de áreas de competencia
CREATE TABLE IF NOT EXISTS areas_competencia (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    permite_grupos BOOLEAN DEFAULT FALSE,
    orden_display INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de niveles de competencia
CREATE TABLE IF NOT EXISTS niveles_competencia (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    orden_display INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de departamentos
CREATE TABLE IF NOT EXISTS departamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    codigo VARCHAR(10) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- TABLAS DE INSCRIPCIONES Y COMPETIDORES
-- ==============================================

-- Tabla de unidades educativas
CREATE TABLE IF NOT EXISTS unidad_educativa (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    departamento_id INTEGER,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL
);

-- Tabla de tutores legales
CREATE TABLE IF NOT EXISTS tutores_legales (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    documento_identidad VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tutores académicos (opcional)
CREATE TABLE IF NOT EXISTS tutores_academicos (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    documento_identidad VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(255),
    especialidad VARCHAR(255),
    unidad_educativa_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unidad_educativa_id) REFERENCES unidad_educativa(id) ON DELETE SET NULL
);

-- Tabla principal de olimpistas
CREATE TABLE IF NOT EXISTS olimpistas (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    documento_identidad VARCHAR(20) UNIQUE NOT NULL,
    grado_escolaridad VARCHAR(50) NOT NULL,
    tutor_legal_id INTEGER NOT NULL,
    tutor_academico_id INTEGER NULL,
    unidad_educativa_id INTEGER NOT NULL,
    departamento_id INTEGER NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    fecha_inscripcion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (tutor_legal_id) REFERENCES tutores_legales(id) ON DELETE RESTRICT,
    FOREIGN KEY (tutor_academico_id) REFERENCES tutores_academicos(id) ON DELETE SET NULL,
    FOREIGN KEY (unidad_educativa_id) REFERENCES unidad_educativa(id) ON DELETE RESTRICT,
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE RESTRICT
);

-- Tabla de inscripciones por área (un olimpista puede competir en múltiples áreas)
CREATE TABLE IF NOT EXISTS inscripciones_areas (
    id SERIAL PRIMARY KEY,
    olimpista_id INTEGER NOT NULL,
    area_competencia_id INTEGER NOT NULL,
    nivel_competencia_id INTEGER NOT NULL,
    es_grupo BOOLEAN DEFAULT FALSE,
    nombre_grupo VARCHAR(255) NULL, -- Para participaciones grupales
    integrantes_grupo TEXT NULL, -- JSON con datos de integrantes adicionales
    estado VARCHAR(20) CHECK (estado IN ('inscrito', 'evaluado', 'clasificado', 'premiado', 'descalificado')) DEFAULT 'inscrito',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (olimpista_id) REFERENCES olimpistas(id) ON DELETE CASCADE,
    FOREIGN KEY (area_competencia_id) REFERENCES areas_competencia(id) ON DELETE RESTRICT,
    FOREIGN KEY (nivel_competencia_id) REFERENCES niveles_competencia(id) ON DELETE RESTRICT,
    UNIQUE(olimpista_id, area_competencia_id, nivel_competencia_id)
);

-- ==============================================
-- TABLAS DE EVALUACIÓN
-- ==============================================

-- Tabla de responsables académicos por área
CREATE TABLE IF NOT EXISTS responsables_academicos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    area_competencia_id INTEGER NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (area_competencia_id) REFERENCES areas_competencia(id) ON DELETE CASCADE,
    UNIQUE(user_id, area_competencia_id)
);

-- Tabla de evaluadores por área
CREATE TABLE IF NOT EXISTS evaluadores_areas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    area_competencia_id INTEGER NOT NULL,
    nivel_competencia_id INTEGER NULL, -- NULL = evalua todos los niveles del área
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (area_competencia_id) REFERENCES areas_competencia(id) ON DELETE CASCADE,
    FOREIGN KEY (nivel_competencia_id) REFERENCES niveles_competencia(id) ON DELETE SET NULL
);

-- Tabla de asignaciones de evaluadores por inscripción (relación N:M)
CREATE TABLE IF NOT EXISTS asignaciones_evaluacion (
    id SERIAL PRIMARY KEY,
    inscripcion_area_id INTEGER NOT NULL,
    evaluador_id INTEGER NOT NULL,
    fase VARCHAR(20) CHECK (fase IN ('clasificacion', 'premiacion')) NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado_por INTEGER NULL,
    FOREIGN KEY (inscripcion_area_id) REFERENCES inscripciones_areas(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluador_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(inscripcion_area_id, evaluador_id, fase)
);

-- Tabla de evaluaciones (primera fase - clasificación)
CREATE TABLE IF NOT EXISTS evaluaciones_clasificacion (
    id SERIAL PRIMARY KEY,
    inscripcion_area_id INTEGER NOT NULL,
    evaluador_id INTEGER NOT NULL,
    puntuacion DECIMAL(5,2) NOT NULL CHECK (puntuacion >= 0 AND puntuacion <= 100),
    observaciones TEXT,
    fecha_evaluacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (inscripcion_area_id) REFERENCES inscripciones_areas(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluador_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Tabla de evaluaciones finales (segunda fase - premiación)
CREATE TABLE IF NOT EXISTS evaluaciones_finales (
    id SERIAL PRIMARY KEY,
    inscripcion_area_id INTEGER NOT NULL,
    evaluador_id INTEGER NOT NULL,
    puntuacion DECIMAL(5,2) NOT NULL CHECK (puntuacion >= 0 AND puntuacion <= 100),
    observaciones TEXT,
    fecha_evaluacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (inscripcion_area_id) REFERENCES inscripciones_areas(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluador_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ==============================================
-- TABLAS DE CONFIGURACIÓN Y MEDALLERO
-- ==============================================

-- Tabla de configuración de medallero por área
CREATE TABLE IF NOT EXISTS configuracion_medallero (
    id SERIAL PRIMARY KEY,
    area_competencia_id INTEGER NOT NULL,
    nivel_competencia_id INTEGER NULL, -- NULL = configuración general del área
    oro INTEGER NOT NULL DEFAULT 1,
    plata INTEGER NOT NULL DEFAULT 1,
    bronce INTEGER NOT NULL DEFAULT 1,
    mencion_honor INTEGER NOT NULL DEFAULT 0,
    total_participantes INTEGER NULL, -- Para calcular porcentajes
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (area_competencia_id) REFERENCES areas_competencia(id) ON DELETE CASCADE,
    FOREIGN KEY (nivel_competencia_id) REFERENCES niveles_competencia(id) ON DELETE SET NULL
);

-- Tabla de resultados finales (clasificados y premiados)
CREATE TABLE IF NOT EXISTS resultados_finales (
    id SERIAL PRIMARY KEY,
    inscripcion_area_id INTEGER NOT NULL,
    fase VARCHAR(20) CHECK (fase IN ('clasificacion', 'premiacion')) NOT NULL,
    posicion INTEGER NOT NULL,
    medalla VARCHAR(20) CHECK (medalla IN ('oro', 'plata', 'bronce', 'mencion_honor', 'sin_medalla')) DEFAULT 'sin_medalla',
    puntuacion_final DECIMAL(5,2) NOT NULL,
    fecha_resultado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscripcion_area_id) REFERENCES inscripciones_areas(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLAS DE LOGS Y AUDITORÍA
-- ==============================================

-- Tabla de logs de cambios (requerimiento específico)
CREATE TABLE IF NOT EXISTS logs_cambios (
    id SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(100) NOT NULL,
    registro_id INTEGER NOT NULL,
    campo_modificado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_id INTEGER NOT NULL,
    accion VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    fecha_cambio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Tabla de credenciales enviadas (mantener la existente)
CREATE TABLE IF NOT EXISTS credenciales_enviadas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    email_enviado VARCHAR(255) NOT NULL,
    password_temporal VARCHAR(255) NOT NULL,
    enviado_por INTEGER NOT NULL,
    fecha_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) CHECK (estado IN ('enviado', 'usado', 'expirado')) DEFAULT 'enviado',
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (enviado_por) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLAS DE CONFIGURACIÓN DEL SISTEMA
-- ==============================================

-- Tabla de fases del proceso de evaluación
CREATE TABLE IF NOT EXISTS fases_evaluacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INTEGER NOT NULL,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'activa', 'completada', 'cancelada')) DEFAULT 'pendiente',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

-- Tabla de rondas/fases para asignación de evaluadores
CREATE TABLE IF NOT EXISTS rondas_asignacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    area_competencia_id INTEGER,
    nivel_competencia_id INTEGER,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'activa', 'completada', 'cancelada')) DEFAULT 'pendiente',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (area_competencia_id) REFERENCES areas_competencia(id) ON DELETE SET NULL,
    FOREIGN KEY (nivel_competencia_id) REFERENCES niveles_competencia(id) ON DELETE SET NULL
);

-- Tabla de configuraciones generales del sistema
CREATE TABLE IF NOT EXISTS configuraciones_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) CHECK (tipo IN ('string', 'number', 'boolean', 'json')) DEFAULT 'string',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

-- ==============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ==============================================

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Índices para olimpistas
CREATE INDEX IF NOT EXISTS idx_olimpistas_documento ON olimpistas(documento_identidad);
CREATE INDEX IF NOT EXISTS idx_olimpistas_unidad ON olimpistas(unidad_educativa_id);
CREATE INDEX IF NOT EXISTS idx_olimpistas_departamento ON olimpistas(departamento_id);

-- Índices para inscripciones
CREATE INDEX IF NOT EXISTS idx_inscripciones_olimpista ON inscripciones_areas(olimpista_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_area ON inscripciones_areas(area_competencia_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_nivel ON inscripciones_areas(nivel_competencia_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_estado ON inscripciones_areas(estado);

-- Índices para evaluaciones
CREATE INDEX IF NOT EXISTS idx_eval_clas_inscripcion ON evaluaciones_clasificacion(inscripcion_area_id);
CREATE INDEX IF NOT EXISTS idx_eval_clas_evaluador ON evaluaciones_clasificacion(evaluador_id);
CREATE INDEX IF NOT EXISTS idx_eval_final_inscripcion ON evaluaciones_finales(inscripcion_area_id);
CREATE INDEX IF NOT EXISTS idx_eval_final_evaluador ON evaluaciones_finales(evaluador_id);

-- Índices para resultados
CREATE INDEX IF NOT EXISTS idx_resultados_inscripcion ON resultados_finales(inscripcion_area_id);
CREATE INDEX IF NOT EXISTS idx_resultados_fase ON resultados_finales(fase);
CREATE INDEX IF NOT EXISTS idx_resultados_posicion ON resultados_finales(posicion);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_logs_tabla ON logs_cambios(tabla_afectada);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs_cambios(fecha_cambio);
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_cambios(usuario_id);

-- ==============================================
-- DATOS INICIALES
-- ==============================================

-- Insertar SOLO usuario administrador por defecto
INSERT INTO users (name, email, password, role, created_at) VALUES 
('Administrador', 'admin@forwardsoft.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;

-- Insertar áreas de competencia comunes
INSERT INTO areas_competencia (nombre, descripcion, permite_grupos, orden_display) VALUES 
('Matemáticas', 'Competencia de resolución de problemas matemáticos', FALSE, 1),
('Física', 'Competencia de conceptos y aplicaciones de física', FALSE, 2),
('Química', 'Competencia de laboratorio y teoría química', FALSE, 3),
('Biología', 'Competencia de ciencias biológicas', FALSE, 4),
('Robótica', 'Competencia de diseño y programación de robots', TRUE, 5),
('Programación', 'Competencia de desarrollo de software', TRUE, 6),
('Ciencias de la Tierra', 'Competencia de geología y ciencias ambientales', FALSE, 7)
ON CONFLICT (nombre) DO NOTHING;

-- Insertar niveles de competencia
INSERT INTO niveles_competencia (nombre, descripcion, orden_display) VALUES 
('Básico', 'Nivel de educación básica', 1),
('Intermedio', 'Nivel de educación media', 2),
('Avanzado', 'Nivel de educación superior', 3)
ON CONFLICT (nombre) DO NOTHING;

-- Insertar departamentos de Bolivia
INSERT INTO departamentos (nombre, codigo) VALUES 
('La Paz', 'LP'),
('Cochabamba', 'CB'),
('Santa Cruz', 'SC'),
('Potosí', 'PT'),
('Oruro', 'OR'),
('Chuquisaca', 'CH'),
('Tarija', 'TJ'),
('Beni', 'BN'),
('Pando', 'PN')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar fases del proceso
INSERT INTO fases_evaluacion (nombre, descripcion, orden, estado) VALUES 
('Inscripciones', 'Período de inscripción de olimpistas', 1, 'completada'),
('Evaluación Inicial', 'Primera fase de evaluación para clasificación', 2, 'pendiente'),
('Publicación Clasificados', 'Publicación de resultados de clasificación', 3, 'pendiente'),
('Evaluación Final', 'Segunda fase de evaluación para premiación', 4, 'pendiente'),
('Publicación Premiados', 'Publicación de resultados finales', 5, 'pendiente'),
('Ceremonia de Premiación', 'Evento de entrega de premios', 6, 'pendiente')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar configuraciones del sistema
INSERT INTO configuraciones_sistema (clave, valor, descripcion, tipo) VALUES 
('sistema_activo', 'true', 'Indica si el sistema está activo', 'boolean'),
('fase_actual', '1', 'Fase actual del proceso de evaluación', 'number'),
('puntuacion_maxima', '100', 'Puntuación máxima en las evaluaciones', 'number'),
('puntuacion_minima', '0', 'Puntuación mínima en las evaluaciones', 'number'),
('medallero_por_defecto', '{"oro": 1, "plata": 1, "bronce": 1, "mencion_honor": 0}', 'Configuración por defecto del medallero', 'json')
ON CONFLICT (clave) DO NOTHING;