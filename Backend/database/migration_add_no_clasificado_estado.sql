

ALTER TABLE inscripciones_areas 
DROP CONSTRAINT IF EXISTS inscripciones_areas_estado_check;


ALTER TABLE inscripciones_areas 
ADD CONSTRAINT inscripciones_areas_estado_check 
CHECK (estado IN ('inscrito', 'evaluado', 'clasificado', 'premiado', 'desclasificado', 'no_clasificado'));

