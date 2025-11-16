<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Models\Olimpista;
use ForwardSoft\Models\InscripcionArea;
use ForwardSoft\Models\TutorLegal;
use ForwardSoft\Models\TutorAcademico;
use ForwardSoft\Models\UnidadEducativa;
use ForwardSoft\Models\AreaCompetencia;
use ForwardSoft\Models\NivelCompetencia;
use ForwardSoft\Models\Departamento;

class ImportController
{
    private $olimpistaModel;
    private $inscripcionModel;
    private $tutorLegalModel;
    private $tutorAcademicoModel;
    private $unidadModel;
    private $areaModel;
    private $nivelModel;
    private $departamentoModel;

    public function __construct()
    {
        $this->olimpistaModel = new Olimpista();
        $this->inscripcionModel = new InscripcionArea();
        $this->tutorLegalModel = new TutorLegal();
        $this->tutorAcademicoModel = new TutorAcademico();
        $this->unidadModel = new UnidadEducativa();
        $this->areaModel = new AreaCompetencia();
        $this->nivelModel = new NivelCompetencia();
        $this->departamentoModel = new Departamento();
    }

    public function importOlimpistas()
    {
        
        if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
            Response::validationError(['csv_file' => 'Debe seleccionar un archivo CSV válido']);
        }

        $file = $_FILES['csv_file'];
        $filePath = $file['tmp_name'];

        
        $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($fileExtension !== 'csv') {
            Response::validationError(['csv_file' => 'El archivo debe ser de tipo CSV']);
        }

        
        if ($file['size'] > 5 * 1024 * 1024) {
            Response::validationError(['csv_file' => 'El archivo no puede ser mayor a 5MB']);
        }

        try {
            $results = $this->processCsvFile($filePath);
            
           
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'success' => true,
                'message' => 'Importación completada',
                'data' => [
                    'total_rows' => $results['total_rows'],
                    'successful_imports' => $results['successful_imports'],
                    'errors' => $results['errors'],
                    'warnings' => $results['warnings']
                ],
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            exit;
            
        } catch (\Exception $e) {
            error_log("Error en importación CSV: " . $e->getMessage());
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Error al procesar el archivo CSV: ' . $e->getMessage()
            ]);
            exit;
        }
    }

    private function processCsvFile($filePath)
    {
        $results = [
            'total_rows' => 0,
            'successful_imports' => 0,
            'errors' => [],
            'warnings' => []
        ];

        $handle = fopen($filePath, 'r');
        if (!$handle) {
            throw new \Exception('No se pudo abrir el archivo CSV');
        }

        
        $headers = fgetcsv($handle, 0, ',', '"', '\\');
        if (!$headers) {
            fclose($handle);
            throw new \Exception('El archivo CSV está vacío');
        }
        
        
        $headers = array_map(function($header) {
            
            $header = trim($header);
            $header = preg_replace('/[\x00-\x1F\x7F]/', '', $header); // Quitar caracteres de control
            $header = trim($header);
            return $header;
        }, $headers);
        
       
        $headers = array_filter($headers, function($header) {
            return !empty(trim($header));
        });
        
        
        $headers = array_values($headers);
        
       
        error_log("Encabezados leídos: " . implode(', ', $headers));
        
        
        $requiredHeaders = [
            'nombre',
            'apellido',
            'documento_identidad',
            'grado_escolaridad',
            'unidad_educativa',
            'departamento',
            'tutor_legal_nombre',
            'tutor_legal_documento',
            'area_competencia',
            'nivel_competencia'
        ];
        
        
        $headerMapping = [];
        foreach ($requiredHeaders as $required) {
            foreach ($headers as $index => $header) {
               
                if (trim($header) === trim($required)) {
                    $headerMapping[$required] = $index;
                    break;
                }
               
                $headerClean = strtolower(preg_replace('/[^a-z]/', '', $header));
                $requiredClean = strtolower(preg_replace('/[^a-z]/', '', $required));
                if ($headerClean === $requiredClean) {
                    $headerMapping[$required] = $index;
                    break;
                }
            }
        }
        
        
        $optionalFields = ['telefono', 'email', 'fecha_nacimiento', 'tutor_academico_nombre', 'tutor_academico_telefono', 'tutor_academico_email', 'es_grupo', 'nombre_grupo'];
        foreach ($optionalFields as $field) {
            if (!isset($headerMapping[$field])) {
                foreach ($headers as $index => $header) {
                    $headerClean = strtolower(preg_replace('/[^a-z]/', '', $header));
                    $fieldClean = strtolower(preg_replace('/[^a-z]/', '', $field));
                    
                   
                    if ($field === 'telefono' && ($headerClean === 'teleefono' || $headerClean === 'telefono')) {
                        $headerMapping[$field] = $index;
                        break;
                    }
                   
                    if ($headerClean === $fieldClean) {
                        $headerMapping[$field] = $index;
                        break;
                    }
                }
            }
        }
        
        error_log("Mapeo de encabezados: " . print_r($headerMapping, true));

       
        $missingHeaders = [];
        foreach ($requiredHeaders as $required) {
            $found = false;
            foreach ($headers as $header) {
                
                if (trim($header) === trim($required)) {
                    $found = true;
                    break;
                }
               
                $headerClean = strtolower(preg_replace('/[^a-z]/', '', $header));
                $requiredClean = strtolower(preg_replace('/[^a-z]/', '', $required));
                if ($headerClean === $requiredClean) {
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $missingHeaders[] = $required;
            }
        }
        
        if (!empty($missingHeaders)) {
            fclose($handle);
            error_log("Encabezados requeridos: " . implode(', ', $requiredHeaders));
            error_log("Encabezados encontrados: " . implode(', ', $headers));
            error_log("Encabezados faltantes: " . implode(', ', $missingHeaders));
            throw new \Exception('Faltan encabezados requeridos: ' . implode(', ', $missingHeaders));
        }

        $rowNumber = 1; 

        while (($data = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
            $rowNumber++;
            $results['total_rows']++;

            try {
                $this->processCsvRow($data, $headers, $rowNumber, $results, $headerMapping);
                $results['successful_imports']++;
            } catch (\Exception $e) {
                $results['errors'][] = [
                    'row' => $rowNumber,
                    'error' => $e->getMessage(),
                    'data' => $data
                ];
            }
        }

        fclose($handle);
        return $results;
    }

    private function processCsvRow($data, $headers, $rowNumber, &$results, $headerMapping)
    {
       
        $rowData = [];
        foreach ($headerMapping as $standardName => $csvIndex) {
            $rowData[$standardName] = isset($data[$csvIndex]) ? $data[$csvIndex] : '';
        }

        
        $this->validateCsvRow($rowData, $rowNumber);

        
        $unidadId = $this->findOrCreateUnidadEducativa($rowData['unidad_educativa'], $rowData['departamento']);

        
        $departamentoId = $this->findDepartamento($rowData['departamento']);

        $areaId = $this->findAreaCompetencia($rowData['area_competencia']);

       
        $nivelId = $this->findNivelCompetencia($rowData['nivel_competencia']);

       
        $existingOlimpista = $this->olimpistaModel->findByDocument($rowData['documento_identidad']);
        if ($existingOlimpista) {
            $results['warnings'][] = [
                'row' => $rowNumber,
                'warning' => 'Olimpista ya existe, actualizando datos',
                'documento' => $rowData['documento_identidad']
            ];
            $this->updateExistingOlimpista($existingOlimpista['id'], $rowData, $unidadId, $departamentoId, $areaId, $nivelId);
            return;
        }

       
        $tutorLegalId = $this->findOrCreateTutorLegal($rowData);

        
        $tutorAcademicoId = null;
        if (!empty($rowData['tutor_academico_nombre'])) {
            $tutorAcademicoId = $this->findOrCreateTutorAcademico($rowData, $unidadId);
        }

        
        $fechaNacimiento = !empty($rowData['fecha_nacimiento']) ? $this->normalizeDate($rowData['fecha_nacimiento']) : null;

       
        $gradoNormalizado = $this->normalizeGrade($rowData['grado_escolaridad'] ?? '');
        if (!$gradoNormalizado) {
            throw new \Exception('Grado de escolaridad inválido o no reconocido: ' . ($rowData['grado_escolaridad'] ?? '')); 
        }

        
        $email = !empty($rowData['email']) ? trim($rowData['email']) : 'sin_email_' . trim($rowData['documento_identidad']) . '@temporal.com';
        $olimpistaId = $this->olimpistaModel->create([
            'nombre' => trim($rowData['nombre']),
            'apellido' => trim($rowData['apellido']),
            'documento_identidad' => trim($rowData['documento_identidad']),
            'fecha_nacimiento' => $fechaNacimiento,
            'telefono' => !empty($rowData['telefono']) ? trim($rowData['telefono']) : null,
            'email' => $email,
            'grado_escolaridad' => $gradoNormalizado,
            'unidad_educativa' => trim($rowData['unidad_educativa']),
            'departamento' => trim($rowData['departamento']),
            'area_competencia' => trim($rowData['area_competencia']),
            'nivel_competencia' => trim($rowData['nivel_competencia']),
            'tutor_legal_id' => $tutorLegalId,
            'tutor_academico_id' => $tutorAcademicoId,
            'unidad_educativa_id' => $unidadId,
            'departamento_id' => $departamentoId,
            'tutor_legal_nombre' => trim($rowData['tutor_legal_nombre']),
            'tutor_legal_telefono' => !empty($rowData['tutor_legal_telefono']) ? trim($rowData['tutor_legal_telefono']) : null,
            'tutor_legal_email' => !empty($rowData['tutor_legal_email']) ? trim($rowData['tutor_legal_email']) : null,
            'tutor_academico_nombre' => !empty($rowData['tutor_academico_nombre']) ? trim($rowData['tutor_academico_nombre']) : null,
            'tutor_academico_telefono' => !empty($rowData['tutor_academico_telefono']) ? trim($rowData['tutor_academico_telefono']) : null,
            'tutor_academico_email' => !empty($rowData['tutor_academico_email']) ? trim($rowData['tutor_academico_email']) : null,
            'estado' => 'activo',
            'migrado_desde_temp' => true
        ]);

        
        if (!$olimpistaId) {
            throw new \Exception('No se pudo crear el olimpista en la base de datos');
        }

        
        $esGrupoValue = trim($rowData['es_grupo'] ?? '');
        $esGrupo = !empty($esGrupoValue) && strtolower($esGrupoValue) === 'si';
        $inscripcionId = $this->inscripcionModel->create([
            'olimpista_id' => $olimpistaId,
            'area_competencia_id' => $areaId,
            'nivel_competencia_id' => $nivelId,
            'es_grupo' => $esGrupo,
            'nombre_grupo' => !empty($rowData['nombre_grupo']) ? trim($rowData['nombre_grupo']) : null,
            'integrantes_grupo' => null
        ]);

        if (!$inscripcionId) {
            throw new \Exception('No se pudo crear la inscripción del olimpista');
        }
    }

    
    private function normalizeDate($value)
    {
        $v = trim((string)$value);
        if ($v === '') return null;

        
        if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $v, $m)) {
            return sprintf('%04d-%02d-%02d', (int)$m[3], (int)$m[2], (int)$m[1]);
        }
        
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m)) {
            return sprintf('%04d-%02d-%02d', (int)$m[1], (int)$m[2], (int)$m[3]);
        }
       
        $ts = strtotime($v);
        if ($ts !== false) {
            return date('Y-m-d', $ts);
        }
        return null;
    }

    private function normalizeGrade($value)
    {
        $v = trim((string)$value);
        if ($v === '') return null;
        $base = mb_strtolower($v, 'UTF-8');
       
        $base = preg_replace('/\s+/', ' ', $base);

        
        $map = [
            '6to de secundaria' => '6to de Secundaria',
            'secundaria 6to' => '6to de Secundaria',
            'sexto de secundaria' => '6to de Secundaria',
            '6to secundaria' => '6to de Secundaria',
            '5to de secundaria' => '5to de Secundaria',
            'primaria 6to' => '6to de Primaria',
            '6to de primaria' => '6to de Primaria',
        ];

        if (isset($map[$base])) return $map[$base];

        
        if (preg_match('/(primaria|secundaria)/i', $v)) {
            return $v; 
        }
        return null;
    }

    private function validateCsvRow($rowData, $rowNumber)
    {
        $requiredFields = [
            'nombre' => 'Nombre',
            'apellido' => 'Apellido',
            'documento_identidad' => 'Documento de identidad',
            'grado_escolaridad' => 'Grado de escolaridad',
            'unidad_educativa' => 'Unidad educativa',
            'departamento' => 'Departamento',
            'tutor_legal_nombre' => 'Nombre del tutor legal',
            'tutor_legal_documento' => 'Documento del tutor legal',
            'area_competencia' => 'Área de competencia',
            'nivel_competencia' => 'Nivel de competencia'
        ];

        foreach ($requiredFields as $field => $label) {
            if (empty(trim($rowData[$field]))) {
                throw new \Exception("Fila {$rowNumber}: El campo '{$label}' es requerido");
            }
        }

       
        if (!preg_match('/^[A-Za-z0-9]+$/', trim($rowData['documento_identidad']))) {
            throw new \Exception("Fila {$rowNumber}: El documento de identidad debe contener solo números y letras");
        }

       
        if (!empty($rowData['email']) && !filter_var($rowData['email'], FILTER_VALIDATE_EMAIL)) {
            throw new \Exception("Fila {$rowNumber}: El email tiene un formato inválido");
        }
    }

    private function findOrCreateUnidadEducativa($nombre, $departamento)
    {
        $unidad = $this->unidadModel->findByName($nombre);
        if ($unidad) {
            return $unidad['id'];
        }

        $departamentoId = $this->findDepartamento($departamento);
        
        return $this->unidadModel->create([
            'nombre' => trim($nombre),
            'departamento_id' => $departamentoId,
            'codigo' => strtoupper(substr($nombre, 0, 10)) . '_' . uniqid()
        ]);
    }

    private function findDepartamento($nombre)
    {
        $departamento = $this->departamentoModel->findByName($nombre);
        if (!$departamento) {
            throw new \Exception("Departamento '{$nombre}' no encontrado. Debe existir en el sistema.");
        }
        return $departamento['id'];
    }

    private function findAreaCompetencia($nombre)
    {
        $area = $this->areaModel->findByName($nombre);
        if (!$area) {
            throw new \Exception("Área de competencia '{$nombre}' no encontrada. Debe existir en el sistema.");
        }
        return $area['id'];
    }

    private function findNivelCompetencia($nombre)
    {
        $nivel = $this->nivelModel->findByName($nombre);
        if (!$nivel) {
            throw new \Exception("Nivel de competencia '{$nombre}' no encontrado. Debe existir en el sistema.");
        }
        return $nivel['id'];
    }

    private function findOrCreateTutorLegal($rowData)
    {
        $tutor = $this->tutorLegalModel->findByDocument($rowData['tutor_legal_documento']);
        if ($tutor) {
            return $tutor['id'];
        }

        return $this->tutorLegalModel->create([
            'nombre_completo' => trim($rowData['tutor_legal_nombre']),
            'documento_identidad' => trim($rowData['tutor_legal_documento']),
            'telefono' => !empty($rowData['tutor_legal_telefono']) ? trim($rowData['tutor_legal_telefono']) : null,
            'email' => !empty($rowData['tutor_legal_email']) ? trim($rowData['tutor_legal_email']) : null,
            'direccion' => !empty($rowData['tutor_legal_direccion']) ? trim($rowData['tutor_legal_direccion']) : null
        ]);
    }

    private function findOrCreateTutorAcademico($rowData, $unidadId)
    {
        if (empty($rowData['tutor_academico_documento'])) {
            return $this->tutorAcademicoModel->create([
                'nombre_completo' => trim($rowData['tutor_academico_nombre']),
                'telefono' => !empty($rowData['tutor_academico_telefono']) ? trim($rowData['tutor_academico_telefono']) : null,
                'email' => !empty($rowData['tutor_academico_email']) ? trim($rowData['tutor_academico_email']) : null,
                'especialidad' => !empty($rowData['tutor_academico_especialidad']) ? trim($rowData['tutor_academico_especialidad']) : null,
                'unidad_educativa_id' => $unidadId
            ]);
        }

        $tutor = $this->tutorAcademicoModel->findByDocument($rowData['tutor_academico_documento']);
        if ($tutor) {
            return $tutor['id'];
        }

        return $this->tutorAcademicoModel->create([
            'nombre_completo' => trim($rowData['tutor_academico_nombre']),
            'documento_identidad' => trim($rowData['tutor_academico_documento']),
            'telefono' => !empty($rowData['tutor_academico_telefono']) ? trim($rowData['tutor_academico_telefono']) : null,
            'email' => !empty($rowData['tutor_academico_email']) ? trim($rowData['tutor_academico_email']) : null,
            'especialidad' => !empty($rowData['tutor_academico_especialidad']) ? trim($rowData['tutor_academico_especialidad']) : null,
            'unidad_educativa_id' => $unidadId
        ]);
    }

    private function updateExistingOlimpista($olimpistaId, $rowData, $unidadId, $departamentoId, $areaId, $nivelId)
    {
       
        $this->olimpistaModel->update($olimpistaId, [
            'nombre' => trim($rowData['nombre']),
            'apellido' => trim($rowData['apellido']),
            'fecha_nacimiento' => !empty($rowData['fecha_nacimiento']) ? trim($rowData['fecha_nacimiento']) : null,
            'telefono' => !empty($rowData['telefono']) ? trim($rowData['telefono']) : null,
            'email' => !empty($rowData['email']) ? trim($rowData['email']) : null,
            'grado_escolaridad' => trim($rowData['grado_escolaridad']),
            'unidad_educativa' => trim($rowData['unidad_educativa']),
            'departamento' => trim($rowData['departamento']),
            'unidad_educativa_id' => $unidadId,
            'departamento_id' => $departamentoId,
            'tutor_legal_nombre' => trim($rowData['tutor_legal_nombre']),
            'tutor_legal_telefono' => !empty($rowData['tutor_legal_telefono']) ? trim($rowData['tutor_legal_telefono']) : null,
            'tutor_legal_email' => !empty($rowData['tutor_legal_email']) ? trim($rowData['tutor_legal_email']) : null,
            'tutor_academico_nombre' => !empty($rowData['tutor_academico_nombre']) ? trim($rowData['tutor_academico_nombre']) : null,
            'tutor_academico_telefono' => !empty($rowData['tutor_academico_telefono']) ? trim($rowData['tutor_academico_telefono']) : null,
            'tutor_academico_email' => !empty($rowData['tutor_academico_email']) ? trim($rowData['tutor_academico_email']) : null,
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        
        $existingInscripcion = $this->inscripcionModel->findByOlimpistaAndAreaAndLevel($olimpistaId, $areaId, $nivelId);
        if (!$existingInscripcion) {
            
            $esGrupoValue = trim($rowData['es_grupo'] ?? '');
            $esGrupo = !empty($esGrupoValue) && strtolower($esGrupoValue) === 'si';
            $inscripcionId = $this->inscripcionModel->create([
                'olimpista_id' => $olimpistaId,
                'area_competencia_id' => $areaId,
                'nivel_competencia_id' => $nivelId,
                'es_grupo' => $esGrupo,
                'nombre_grupo' => !empty($rowData['nombre_grupo']) ? trim($rowData['nombre_grupo']) : null,
                'integrantes_grupo' => null
            ]);

            if (!$inscripcionId) {
                throw new \Exception('No se pudo crear la inscripción del olimpista existente');
            }
        } else {
            
            $esGrupoValue = trim($rowData['es_grupo'] ?? '');
            $esGrupo = !empty($esGrupoValue) && strtolower($esGrupoValue) === 'si';
            
            if (!empty($rowData['nombre_grupo']) && $existingInscripcion['nombre_grupo'] !== trim($rowData['nombre_grupo'])) {
                $this->inscripcionModel->update($existingInscripcion['id'], [
                    'nombre_grupo' => trim($rowData['nombre_grupo']),
                    'es_grupo' => $esGrupo
                ]);
            }
        }
    }

    public function downloadTemplate()
    {
        
        while (ob_get_level()) {
            ob_end_clean();
        }
        
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

        $filename = 'template_olimpistas_' . date('Y-m-d') . '.csv';
        
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        
        $output = fopen('php://output', 'w');
        
        // Escribir BOM para UTF-8
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Escribir headers
        fputcsv($output, $headers, ',', '"', '\\');
        
        
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
        fputcsv($output, $exampleRow, ',', '"', '\\');
        
        fclose($output);
        exit;
    }
}
