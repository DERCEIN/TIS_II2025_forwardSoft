
ALTER TABLE asignaciones_evaluacion 
DROP CONSTRAINT IF EXISTS asignaciones_evaluacion_fase_check;

ALTER TABLE asignaciones_evaluacion 
ADD CONSTRAINT asignaciones_evaluacion_fase_check 
CHECK (fase IN ('clasificacion', 'final'));


UPDATE asignaciones_evaluacion 
SET fase = 'final' 
WHERE fase = 'premiacion';


