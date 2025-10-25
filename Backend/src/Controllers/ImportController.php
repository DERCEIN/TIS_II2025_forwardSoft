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
        // Verificar que se haya subido un archivo
        if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
            Response::validationError(['csv_file' => 'Debe seleccionar un archivo CSV válido']);
        }

        $file = $_FILES['csv_file'];
        $filePath = $file['tmp_name'];

        // Validar tipo de archivo
        $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($fileExtension !== 'csv') {
            Response::validationError(['csv_file' => 'El archivo debe ser de tipo CSV']);
        }

        // Validar tamaño del archivo (máximo 5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            Response::validationError(['csv_file' => 'El archivo no puede ser mayor a 5MB']);
        }

        try {
            $results = $this->processCsvFile($filePath);
            
            // Respuesta manual sin usar Response::success()
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

        // Leer encabezados
        $headers = fgetcsv($handle, 0, ',', '"', '\\');
        if (!$headers) {
            fclose($handle);
            throw new \Exception('El archivo CSV está vacío');
        }
        
        // Limpiar encabezados (quitar espacios, BOM y caracteres especiales)
        $headers = array_map(function($header) {
            // Quitar BOM y caracteres invisibles
            $header = trim($header);
            $header = preg_replace('/[\x00-\x1F\x7F]/', '', $header); // Quitar caracteres de control
            $header = trim($header);
            return $header;
        }, $headers);
        
        // Filtrar encabezados vacíos
        $headers = array_filter($headers, function($header) {
            return !empty(trim($header));
        });
        
        // Reindexar el array
        $headers = array_values($headers);
        
        // Debug: mostrar encabezados leídos
        error_log("Encabezados leídos: " . implode(', ', $headers));
        
        // Validar encabezados requeridos
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
        
        // Crear mapeo de encabezados del CSV a nombres estándar
        $headerMapping = [];
        foreach ($requiredHeaders as $required) {
            foreach ($headers as $index => $header) {
                // Comparación exacta
                if (trim($header) === trim($required)) {
                    $headerMapping[$required] = $index;
                    break;
                }
                // Comparación flexible para errores tipográficos
                $headerClean = strtolower(preg_replace('/[^a-z]/', '', $header));
                $requiredClean = strtolower(preg_replace('/[^a-z]/', '', $required));
                if ($headerClean === $requiredClean) {
                    $headerMapping[$required] = $index;
                    break;
                }
            }
        }
        
        // Mapeo adicional para campos opcionales con typos comunes
        $optionalFields = ['telefono', 'email', 'fecha_nacimiento', 'tutor_academico_nombre', 'tutor_academico_telefono', 'tutor_academico_email', 'es_grupo', 'nombre_grupo'];
        foreach ($optionalFields as $field) {
            if (!isset($headerMapping[$field])) {
                foreach ($headers as $index => $header) {
                    $headerClean = strtolower(preg_replace('/[^a-z]/', '', $header));
                    $fieldClean = strtolower(preg_replace('/[^a-z]/', '', $field));
                    
                    // Manejar typos específicos
                    if ($field === 'telefono' && ($headerClean === 'teleefono' || $headerClean === 'telefono')) {
                        $headerMapping[$field] = $index;
                        break;
                    }
                    // Comparación general flexible
                    if ($headerClean === $fieldClean) {
                        $headerMapping[$field] = $index;
                        break;
                    }
                }
            }
        }
        
        error_log("Mapeo de encabezados: " . print_r($headerMapping, true));

        // Verificar cada encabezado requerido individualmente
        $missingHeaders = [];
        foreach ($requiredHeaders as $required) {
            $found = false;
            foreach ($headers as $header) {
                // Comparación exacta
                if (trim($header) === trim($required)) {
                    $found = true;
                    break;
                }
                // Comparación flexible para errores tipográficos comunes
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

        $rowNumber = 1; // Empezar en 1 porque ya leímos los headers

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
        // Crear array asociativo usando el mapeo
        $rowData = [];
        foreach ($headerMapping as $standardName => $csvIndex) {
            $rowData[$standardName] = isset($data[$csvIndex]) ? $data[$csvIndex] : '';
        }

        // Validar datos requeridos
        $this->validateCsvRow($rowData, $rowNumber);

        // Buscar o crear unidad educativa
        $unidadId = $this->findOrCreateUnidadEducativa($rowData['unidad_educativa'], $rowData['departamento']);

        // Buscar departamento
        $departamentoId = $this->findDepartamento($rowData['departamento']);

        // Buscar área de competencia
        $areaId = $this->findAreaCompetencia($rowData['area_competencia']);

        // Buscar nivel de competencia
        $nivelId = $this->findNivelCompetencia($rowData['nivel_competencia']);

        // Verificar si el olimpista ya existe
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

        // Crear tutor legal
        $tutorLegalId = $this->findOrCreateTutorLegal($rowData);

        // Crear tutor académico si se proporciona
        $tutorAcademicoId = null;
        if (!empty($rowData['tutor_academico_nombre'])) {
            $tutorAcademicoId = $this->findOrCreateTutorAcademico($rowData, $unidadId);
        }

        // Crear olimpista con estructura unificada (con FK para integridad)
        $email = !empty($rowData['email']) ? trim($rowData['email']) : 'sin_email_' . trim($rowData['documento_identidad']) . '@temporal.com';
        $olimpistaId = $this->olimpistaModel->create([
            'nombre' => trim($rowData['nombre']),
            'apellido' => trim($rowData['apellido']),
            'documento_identidad' => trim($rowData['documento_identidad']),
            'fecha_nacimiento' => !empty($rowData['fecha_nacimiento']) ? trim($rowData['fecha_nacimiento']) : null,
            'telefono' => !empty($rowData['telefono']) ? trim($rowData['telefono']) : null,
            'email' => $email,
            'grado_escolaridad' => trim($rowData['grado_escolaridad']),
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

        // Crear inscripción
        $esGrupoValue = trim($rowData['es_grupo'] ?? '');
        $esGrupo = !empty($esGrupoValue) && strtolower($esGrupoValue) === 'si';
        $this->inscripcionModel->create([
            'olimpista_id' => $olimpistaId,
            'area_competencia_id' => $areaId,
            'nivel_competencia_id' => $nivelId,
            'es_grupo' => $esGrupo,
            'nombre_grupo' => !empty($rowData['nombre_grupo']) ? trim($rowData['nombre_grupo']) : null,
            'integrantes_grupo' => null
        ]);
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

        // Validar formato de documento (solo números y letras)
        if (!preg_match('/^[A-Za-z0-9]+$/', trim($rowData['documento_identidad']))) {
            throw new \Exception("Fila {$rowNumber}: El documento de identidad debe contener solo números y letras");
        }

        // Validar email si se proporciona
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
        // Actualizar solo datos básicos del olimpista (sin sobrescribir área/nivel)
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

        // Verificar si ya tiene inscripción en esta área y nivel
        $existingInscripcion = $this->inscripcionModel->findByOlimpistaAndAreaAndLevel($olimpistaId, $areaId, $nivelId);
        if (!$existingInscripcion) {
            // Crear nueva inscripción
            $esGrupoValue = trim($rowData['es_grupo'] ?? '');
            $esGrupo = !empty($esGrupoValue) && strtolower($esGrupoValue) === 'si';
            $this->inscripcionModel->create([
                'olimpista_id' => $olimpistaId,
                'area_competencia_id' => $areaId,
                'nivel_competencia_id' => $nivelId,
                'es_grupo' => $esGrupo,
                'nombre_grupo' => !empty($rowData['nombre_grupo']) ? trim($rowData['nombre_grupo']) : null,
                'integrantes_grupo' => null
            ]);
        } else {
            // Si ya existe la inscripción, solo actualizar datos del grupo si es necesario
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
        // Limpiar cualquier output previo
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
        
        // Escribir fila de ejemplo
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
