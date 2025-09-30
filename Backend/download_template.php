<?php
// Script simple para descargar plantilla
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="plantilla_olimpistas.csv"');

echo "\xEF\xBB\xBF";

// Encabezados
$headers = [
    'nombre',
    'apellido', 
    'documento_identidad',
    'fecha_nacimiento',
    'telefono',
    'email',
    'grado_escolaridad',
    'unidad_educativa',
    'departamento',
    'area_competencia',
    'nivel_competencia',
    'tutor_legal_nombre',
    'tutor_legal_documento',
    'tutor_legal_telefono',
    'tutor_legal_email',
    'tutor_academico_nombre',
    'tutor_academico_telefono',
    'tutor_academico_email',
    'es_grupo',
    'nombre_grupo'
];

// Datos de ejemplo
$exampleRow = [
    'Juan',
    'Pérez García',
    '12345678',
    '2005-03-15',
    '70123456',
    'juan.perez@email.com',
    '6to de Secundaria',
    'Colegio San José',
    'La Paz',
    'Matemáticas',
    'Secundaria',
    'María García López',
    '87654321',
    '70123457',
    'maria.garcia@email.com',
    'Prof. Carlos Mendoza',
    '70123458',
    'carlos.mendoza@email.com',
    'No',
    ''
];

// Escribir headers
fputcsv(STDOUT, $headers);

// Escribir fila de ejemplo
fputcsv(STDOUT, $exampleRow);
?>
