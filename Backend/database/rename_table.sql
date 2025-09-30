-- Script para renombrar tablas en PostgreSQL

-- Renombrar tabla olimpistas_temp a olimpistas_importados
ALTER TABLE olimpistas_temp RENAME TO olimpistas_importados;

-- Verificar el cambio
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'olimpistas%';

-- Mostrar estructura de la tabla renombrada
\d olimpistas_importados;

