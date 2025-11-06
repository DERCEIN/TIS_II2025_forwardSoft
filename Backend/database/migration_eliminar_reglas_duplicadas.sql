
DELETE FROM reglas_desclasificacion rd1
USING reglas_desclasificacion rd2
WHERE rd1.id > rd2.id
  AND rd1.area_competencia_id = rd2.area_competencia_id
  AND rd1.nombre_regla = rd2.nombre_regla
  AND rd1.tipo = rd2.tipo;


ALTER TABLE reglas_desclasificacion
ADD CONSTRAINT reglas_desclasificacion_unique_area_nombre_tipo 
UNIQUE (area_competencia_id, nombre_regla, tipo);



