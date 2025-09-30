-- Esquema simple para ForwardSoft Olimpiadas
-- PostgreSQL 15.10

-- ==============================================
-- TABLAS PRINCIPALES
-- ==============================================

-- Tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'evaluador',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

-- Tabla de departamentos
CREATE TABLE departamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    codigo VARCHAR(10) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de unidades educativas
CREATE TABLE unidades_educativas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    departamento_id INTEGER NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

-- Tabla de tutores legales
CREATE TABLE tutores_legales (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    documento_identidad VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tutores académicos
CREATE TABLE tutores_academicos (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    documento_identidad VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(255),
    especialidad VARCHAR(100),
    unidad_educativa_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unidad_educativa_id) REFERENCES unidades_educativas(id)
);

-- Tabla de olimpistas unificada
CREATE TABLE olimpistas (
    id SERIAL PRIMARY KEY,
    -- Datos personales
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    nombre_completo VARCHAR(255) GENERATED ALWAYS AS (nombre || ' ' || apellido) STORED,
    documento_identidad VARCHAR(20) UNIQUE NOT NULL,
    fecha_nacimiento DATE,
    telefono VARCHAR(20),
    email VARCHAR(150) UNIQUE NOT NULL,
    
    -- Datos académicos
    grado_escolaridad VARCHAR(50),
    unidad_educativa VARCHAR(200),
    departamento VARCHAR(100),
    
    -- Datos de competencia
    area_competencia VARCHAR(100),
    nivel_competencia VARCHAR(50),
    
    -- Referencias FK a tablas relacionadas
    tutor_legal_id INTEGER,
    tutor_academico_id INTEGER,
    unidad_educativa_id INTEGER,
    departamento_id INTEGER,
    
    -- Datos de tutores (opcionales para importación)
    tutor_legal_nombre VARCHAR(255),
    tutor_legal_telefono VARCHAR(20),
    tutor_legal_email VARCHAR(255),
    tutor_academico_nombre VARCHAR(255),
    tutor_academico_telefono VARCHAR(20),
    tutor_academico_email VARCHAR(255),
    
    -- Metadatos
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'activo',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    
    -- Campos para migración
    migrado_desde_temp BOOLEAN DEFAULT FALSE,
    migrado_desde_olimpistas BOOLEAN DEFAULT FALSE,
    
    -- Relaciones de clave foránea
    FOREIGN KEY (tutor_legal_id) REFERENCES tutores_legales(id),
    FOREIGN KEY (tutor_academico_id) REFERENCES tutores_academicos(id),
    FOREIGN KEY (unidad_educativa_id) REFERENCES unidades_educativas(id),
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

-- Tabla de áreas de competencia
CREATE TABLE areas_competencia (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    permite_grupos BOOLEAN DEFAULT FALSE,
    orden_display INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de niveles de competencia
CREATE TABLE niveles_competencia (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    orden_display INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de inscripciones por área
CREATE TABLE inscripciones_areas (
    id SERIAL PRIMARY KEY,
    olimpista_id INTEGER NOT NULL,
    area_competencia_id INTEGER NOT NULL,
    nivel_competencia_id INTEGER NOT NULL,
    es_grupo BOOLEAN DEFAULT FALSE,
    nombre_grupo VARCHAR(255),
    integrantes_grupo TEXT,
    estado VARCHAR(20) DEFAULT 'inscrito',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (olimpista_id) REFERENCES olimpistas(id) ON DELETE CASCADE,
    FOREIGN KEY (area_competencia_id) REFERENCES areas_competencia(id),
    FOREIGN KEY (nivel_competencia_id) REFERENCES niveles_competencia(id),
    UNIQUE(olimpista_id, area_competencia_id, nivel_competencia_id)
);

-- Tabla de evaluaciones de clasificación
CREATE TABLE evaluaciones_clasificacion (
    id SERIAL PRIMARY KEY,
    inscripcion_area_id INTEGER NOT NULL,
    evaluador_id INTEGER NOT NULL,
    puntuacion DECIMAL(5,2) NOT NULL,
    observaciones TEXT,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscripcion_area_id) REFERENCES inscripciones_areas(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluador_id) REFERENCES users(id),
    UNIQUE(inscripcion_area_id, evaluador_id)
);

-- Tabla de evaluaciones finales
CREATE TABLE evaluaciones_finales (
    id SERIAL PRIMARY KEY,
    inscripcion_area_id INTEGER NOT NULL,
    evaluador_id INTEGER NOT NULL,
    puntuacion DECIMAL(5,2) NOT NULL,
    observaciones TEXT,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscripcion_area_id) REFERENCES inscripciones_areas(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluador_id) REFERENCES users(id),
    UNIQUE(inscripcion_area_id, evaluador_id)
);

-- Tabla de resultados finales
CREATE TABLE resultados_finales (
    id SERIAL PRIMARY KEY,
    inscripcion_area_id INTEGER NOT NULL,
    fase VARCHAR(20) NOT NULL,
    posicion INTEGER NOT NULL,
    medalla VARCHAR(20),
    puntuacion_final DECIMAL(5,2),
    fecha_resultado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscripcion_area_id) REFERENCES inscripciones_areas(id) ON DELETE CASCADE
);

-- Tabla de configuración del medallero
CREATE TABLE configuracion_medallero (
    id SERIAL PRIMARY KEY,
    area_competencia_id INTEGER NOT NULL,
    nivel_competencia_id INTEGER,
    oro INTEGER DEFAULT 1,
    plata INTEGER DEFAULT 1,
    bronce INTEGER DEFAULT 1,
    mencion_honor INTEGER DEFAULT 0,
    total_participantes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (area_competencia_id) REFERENCES areas_competencia(id) ON DELETE CASCADE,
    FOREIGN KEY (nivel_competencia_id) REFERENCES niveles_competencia(id) ON DELETE CASCADE,
    UNIQUE(area_competencia_id, nivel_competencia_id)
);

-- Tabla de credenciales enviadas
CREATE TABLE credenciales_enviadas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    email_enviado VARCHAR(255) NOT NULL,
    password_temporal VARCHAR(255) NOT NULL,
    enviado_por INTEGER NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'enviado',
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (enviado_por) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de logs de cambios
CREATE TABLE logs_cambios (
    id SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(100) NOT NULL,
    registro_id INTEGER NOT NULL,
    accion VARCHAR(20) NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_id INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ==============================================
-- DATOS INICIALES
-- ==============================================

-- Insertar usuario administrador
INSERT INTO users (name, email, password, role, created_at) VALUES 
('Administrador', 'admin@forwardsoft.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', CURRENT_TIMESTAMP);

-- Insertar departamentos de Bolivia
INSERT INTO departamentos (nombre, codigo, created_at) VALUES 
('La Paz', 'LP', CURRENT_TIMESTAMP),
('Cochabamba', 'CB', CURRENT_TIMESTAMP),
('Santa Cruz', 'SC', CURRENT_TIMESTAMP),
('Oruro', 'OR', CURRENT_TIMESTAMP),
('Potosí', 'PT', CURRENT_TIMESTAMP),
('Tarija', 'TJ', CURRENT_TIMESTAMP),
('Chuquisaca', 'CH', CURRENT_TIMESTAMP),
('Beni', 'BN', CURRENT_TIMESTAMP),
('Pando', 'PD', CURRENT_TIMESTAMP);

-- Insertar áreas de competencia
INSERT INTO areas_competencia (nombre, descripcion, permite_grupos, orden_display, created_at) VALUES 
('Matemáticas', 'Competencia en resolución de problemas matemáticos', false, 1, CURRENT_TIMESTAMP),
('Física', 'Competencia en principios y aplicaciones de la física', false, 2, CURRENT_TIMESTAMP),
('Química', 'Competencia en química teórica y experimental', false, 3, CURRENT_TIMESTAMP),
('Biología', 'Competencia en ciencias biológicas', false, 4, CURRENT_TIMESTAMP),
('Informática', 'Competencia en programación y ciencias de la computación', true, 5, CURRENT_TIMESTAMP);

-- Insertar niveles de competencia
INSERT INTO niveles_competencia (nombre, descripcion, orden_display, created_at) VALUES 
('Primaria', 'Nivel de educación primaria', 1, CURRENT_TIMESTAMP),
('Secundaria', 'Nivel de educación secundaria', 2, CURRENT_TIMESTAMP),
('Preuniversitario', 'Nivel preuniversitario', 3, CURRENT_TIMESTAMP);

-- Insertar configuración del medallero por defecto
INSERT INTO configuracion_medallero (area_competencia_id, nivel_competencia_id, oro, plata, bronce, mencion_honor, created_at) 
SELECT a.id, n.id, 1, 1, 1, 0, CURRENT_TIMESTAMP
FROM areas_competencia a, niveles_competencia n;
