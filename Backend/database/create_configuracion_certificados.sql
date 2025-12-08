-- Tabla para almacenar la configuración de diseño de certificados
CREATE TABLE IF NOT EXISTS configuracion_certificados (
    id SERIAL PRIMARY KEY,
    
    -- Colores
    fondo_color VARCHAR(20) DEFAULT '#FDFDFF',
    borde_color VARCHAR(20) DEFAULT '#173A78',
    borde_secundario_color VARCHAR(20) DEFAULT '#C8D2EB',
    texto_principal_color VARCHAR(20) DEFAULT '#2F3F76',
    texto_secundario_color VARCHAR(20) DEFAULT '#282828',
    
    -- Fuente del título
    titulo_fuente VARCHAR(50) DEFAULT 'times',
    titulo_estilo VARCHAR(20) DEFAULT 'bold',
    titulo_tamano INTEGER DEFAULT 36,
    
    -- Fuente del nombre
    nombre_fuente VARCHAR(50) DEFAULT 'times',
    nombre_estilo VARCHAR(20) DEFAULT 'bold',
    nombre_tamano INTEGER DEFAULT 54,
    
    -- Fuente del cuerpo
    cuerpo_fuente VARCHAR(50) DEFAULT 'times',
    cuerpo_estilo VARCHAR(20) DEFAULT 'normal',
    cuerpo_tamano INTEGER DEFAULT 14,
    
    -- Logo
    logo_url VARCHAR(255) DEFAULT '/sansi-logo.png',
    logo_tamano INTEGER DEFAULT 130,
    logo_posicion_x INTEGER DEFAULT 45,
    logo_posicion_y VARCHAR(20) DEFAULT 'center',
    
    -- Textos personalizables
    texto_honor TEXT DEFAULT 'Por haber obtenido {puesto} {medalla} en el área de {area}, durante la gestión {gestion}.',
    texto_participacion TEXT DEFAULT 'Por su valiosa participación en el área de {area} durante la gestión {gestion}, demostrando compromiso con la ciencia y la tecnología.',
    texto_firma_izquierda VARCHAR(255) DEFAULT 'Coordinador de Área',
    texto_firma_derecha VARCHAR(255) DEFAULT 'Director / Autoridad',
    texto_pie_pagina VARCHAR(255) DEFAULT 'SanSi · Olimpiada de Ciencia y Tecnología · Certificado Oficial',
    
    -- Espaciado
    margen INTEGER DEFAULT 15,
    radio_borde INTEGER DEFAULT 6,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_configuracion_certificados_updated ON configuracion_certificados(updated_at DESC);

