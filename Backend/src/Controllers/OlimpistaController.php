<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Models\Olimpista;
use ForwardSoft\Models\InscripcionArea;
use ForwardSoft\Models\TutorLegal;
use ForwardSoft\Models\TutorAcademico;
use ForwardSoft\Models\UnidadEducativa;
use ForwardSoft\Models\ConfiguracionAreaEvaluacion;

class OlimpistaController
{
    private $olimpistaModel;
    private $inscripcionModel;
    private $tutorLegalModel;
    private $tutorAcademicoModel;
    private $unidadModel;

    public function __construct()
    {
        $this->olimpistaModel = new Olimpista();
        $this->inscripcionModel = new InscripcionArea();
        $this->tutorLegalModel = new TutorLegal();
        $this->tutorAcademicoModel = new TutorAcademico();
        $this->unidadModel = new UnidadEducativa();
    }

    public function index()
    {
        try {
            $filters = [
                'area_id' => $_GET['area_id'] ?? null,
                'nivel_id' => $_GET['nivel_id'] ?? null,
                'departamento_id' => $_GET['departamento_id'] ?? null,
                'estado' => $_GET['estado'] ?? null,
                'search' => $_GET['search'] ?? null
            ];

            $olimpistas = $this->olimpistaModel->getAllWithFilters($filters);
            
            Response::success($olimpistas, 'Lista de olimpistas obtenida');
        } catch (\Exception $e) {
            error_log('Error en OlimpistaController::index: ' . $e->getMessage());
            Response::error('Error interno del servidor: ' . $e->getMessage(), 500);
        }
    }

    public function show($id)
    {
        $olimpista = $this->olimpistaModel->getByIdWithDetails($id);
        
        if (!$olimpista) {
            Response::notFound('Olimpista no encontrado');
        }

       
        $inscripcionesDetalle = $this->olimpistaModel->getInscripcionesDetalle($id);
        $olimpista['inscripciones_detalle'] = $inscripcionesDetalle;

        Response::success($olimpista, 'Olimpista encontrado');
    }

    public function create()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError(['general' => 'Datos de entrada inválidos']);
        }

        $errors = $this->validateOlimpistaData($input);
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        
        if ($this->olimpistaModel->findByDocument($input['documento_identidad'])) {
            Response::validationError(['documento_identidad' => 'El documento de identidad ya está registrado']);
        }

        try {
            
            $tutorLegalId = $this->tutorLegalModel->create([
                'nombre_completo' => $input['tutor_legal']['nombre_completo'],
                'documento_identidad' => $input['tutor_legal']['documento_identidad'],
                'telefono' => $input['tutor_legal']['telefono'] ?? null,
                'email' => $input['tutor_legal']['email'] ?? null,
                'direccion' => $input['tutor_legal']['direccion'] ?? null
            ]);

            
            $tutorAcademicoId = null;
            if (isset($input['tutor_academico']) && !empty($input['tutor_academico']['nombre_completo'])) {
                $tutorAcademicoId = $this->tutorAcademicoModel->create([
                    'nombre_completo' => $input['tutor_academico']['nombre_completo'],
                    'documento_identidad' => $input['tutor_academico']['documento_identidad'] ?? null,
                    'telefono' => $input['tutor_academico']['telefono'] ?? null,
                    'email' => $input['tutor_academico']['email'] ?? null,
                    'especialidad' => $input['tutor_academico']['especialidad'] ?? null,
                    'unidad_educativa_id' => $input['unidad_educativa_id']
                ]);
            }

            
            $olimpistaId = $this->olimpistaModel->create([
                'nombre_completo' => $input['nombre_completo'],
                'documento_identidad' => $input['documento_identidad'],
                'grado_escolaridad' => $input['grado_escolaridad'],
                'tutor_legal_id' => $tutorLegalId,
                'tutor_academico_id' => $tutorAcademicoId,
                'unidad_educativa_id' => $input['unidad_educativa_id'],
                'departamento_id' => $input['departamento_id'],
                'telefono' => $input['telefono'] ?? null,
                'email' => $input['email'] ?? null
            ]);

            
            if (isset($input['areas']) && is_array($input['areas']) && count($input['areas']) > 1) {
                $areaIds = array_map(function($area) {
                    return $area['area_competencia_id'];
                }, $input['areas']);
                
                $configAreaModel = new ConfiguracionAreaEvaluacion();
                $conflictos = $configAreaModel->validarChoquesHorarios($areaIds);
                
                if (!empty($conflictos)) {
                    $mensajeConflicto = "Conflicto de horarios detectado:\n";
                    foreach ($conflictos as $conflicto) {
                        $mensajeConflicto .= "- {$conflicto['area1_nombre']} y {$conflicto['area2_nombre']} tienen horarios que se solapan.\n";
                    }
                    $mensajeConflicto .= "Por favor, ajuste los periodos de evaluación en la configuración de áreas.";
                    
                    Response::validationError([
                        'conflictos_horarios' => $mensajeConflicto,
                        'detalles' => $conflictos
                    ]);
                    return;
                }
            }

            
            if (isset($input['areas']) && is_array($input['areas'])) {
                foreach ($input['areas'] as $area) {
                    $this->inscripcionModel->create([
                        'olimpista_id' => $olimpistaId,
                        'area_competencia_id' => $area['area_competencia_id'],
                        'nivel_competencia_id' => $area['nivel_competencia_id'],
                        'es_grupo' => $area['es_grupo'] ?? false,
                        'nombre_grupo' => $area['nombre_grupo'] ?? null,
                        'integrantes_grupo' => isset($area['integrantes_grupo']) ? json_encode($area['integrantes_grupo']) : null
                    ]);
                }
            }

            $newOlimpista = $this->olimpistaModel->getByIdWithDetails($olimpistaId);
            
            Response::success($newOlimpista, 'Olimpista registrado exitosamente', 201);
            
        } catch (\Exception $e) {
            error_log("Error al crear olimpista: " . $e->getMessage());
            Response::serverError('Error al registrar el olimpista');
        }
    }

    public function update($id)
    {
        $olimpista = $this->olimpistaModel->findById($id);
        
        if (!$olimpista) {
            Response::notFound('Olimpista no encontrado');
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError(['general' => 'Datos de entrada inválidos']);
        }

        $errors = $this->validateOlimpistaData($input, $id);
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        try {
            // Actualizar datos del olimpista
            $this->olimpistaModel->update($id, [
                'nombre_completo' => $input['nombre_completo'],
                'grado_escolaridad' => $input['grado_escolaridad'],
                'telefono' => $input['telefono'] ?? null,
                'email' => $input['email'] ?? null,
                'updated_at' => date('Y-m-d H:i:s')
            ]);

            // Actualizar tutor legal
            $this->tutorLegalModel->update($olimpista['tutor_legal_id'], [
                'nombre_completo' => $input['tutor_legal']['nombre_completo'],
                'telefono' => $input['tutor_legal']['telefono'] ?? null,
                'email' => $input['tutor_legal']['email'] ?? null,
                'direccion' => $input['tutor_legal']['direccion'] ?? null
            ]);

            // Actualizar o crear tutor académico
            if (isset($input['tutor_academico']) && !empty($input['tutor_academico']['nombre_completo'])) {
                if ($olimpista['tutor_academico_id']) {
                    $this->tutorAcademicoModel->update($olimpista['tutor_academico_id'], [
                        'nombre_completo' => $input['tutor_academico']['nombre_completo'],
                        'telefono' => $input['tutor_academico']['telefono'] ?? null,
                        'email' => $input['tutor_academico']['email'] ?? null,
                        'especialidad' => $input['tutor_academico']['especialidad'] ?? null
                    ]);
                } else {
                    $tutorAcademicoId = $this->tutorAcademicoModel->create([
                        'nombre_completo' => $input['tutor_academico']['nombre_completo'],
                        'documento_identidad' => $input['tutor_academico']['documento_identidad'] ?? null,
                        'telefono' => $input['tutor_academico']['telefono'] ?? null,
                        'email' => $input['tutor_academico']['email'] ?? null,
                        'especialidad' => $input['tutor_academico']['especialidad'] ?? null,
                        'unidad_educativa_id' => $input['unidad_educativa_id']
                    ]);
                    
                    $this->olimpistaModel->update($id, ['tutor_academico_id' => $tutorAcademicoId]);
                }
            }

            $updatedOlimpista = $this->olimpistaModel->getByIdWithDetails($id);
            
            Response::success($updatedOlimpista, 'Olimpista actualizado exitosamente');
            
        } catch (\Exception $e) {
            error_log("Error al actualizar olimpista: " . $e->getMessage());
            Response::serverError('Error al actualizar el olimpista');
        }
    }

    public function delete($id)
    {
        $olimpista = $this->olimpistaModel->findById($id);
        
        if (!$olimpista) {
            Response::notFound('Olimpista no encontrado');
        }

        try {
            $this->olimpistaModel->delete($id);
            Response::success(null, 'Olimpista eliminado exitosamente');
        } catch (\Exception $e) {
            error_log("Error al eliminar olimpista: " . $e->getMessage());
            Response::serverError('Error al eliminar el olimpista');
        }
    }

    public function getByArea($areaId)
    {
        $nivelId = $_GET['nivel_id'] ?? null;
        $olimpistas = $this->olimpistaModel->getByAreaAndLevel($areaId, $nivelId);
        
        Response::success($olimpistas, 'Olimpistas por área obtenidos');
    }

    public function getByLevel($nivelId)
    {
        $areaId = $_GET['area_id'] ?? null;
        $olimpistas = $this->olimpistaModel->getByAreaAndLevel($areaId, $nivelId);
        
        Response::success($olimpistas, 'Olimpistas por nivel obtenidos');
    }

    private function validateOlimpistaData($input, $excludeId = null)
    {
        $errors = [];

        if (empty($input['nombre_completo'])) {
            $errors['nombre_completo'] = 'El nombre completo es requerido';
        }

        if (empty($input['documento_identidad'])) {
            $errors['documento_identidad'] = 'El documento de identidad es requerido';
        } elseif ($excludeId && $this->olimpistaModel->findByDocument($input['documento_identidad'], $excludeId)) {
            $errors['documento_identidad'] = 'El documento de identidad ya está registrado';
        }

        if (empty($input['grado_escolaridad'])) {
            $errors['grado_escolaridad'] = 'El grado de escolaridad es requerido';
        }

        if (empty($input['unidad_educativa_id'])) {
            $errors['unidad_educativa_id'] = 'La unidad educativa es requerida';
        }

        if (empty($input['departamento_id'])) {
            $errors['departamento_id'] = 'El departamento es requerido';
        }

        // Validar tutor legal
        if (empty($input['tutor_legal']['nombre_completo'])) {
            $errors['tutor_legal.nombre_completo'] = 'El nombre del tutor legal es requerido';
        }

        if (empty($input['tutor_legal']['documento_identidad'])) {
            $errors['tutor_legal.documento_identidad'] = 'El documento del tutor legal es requerido';
        }

        // Validar áreas de inscripción
        if (empty($input['areas']) || !is_array($input['areas'])) {
            $errors['areas'] = 'Debe seleccionar al menos un área de competencia';
        } else {
            foreach ($input['areas'] as $index => $area) {
                if (empty($area['area_competencia_id'])) {
                    $errors["areas.{$index}.area_competencia_id"] = 'El área de competencia es requerida';
                }
                if (empty($area['nivel_competencia_id'])) {
                    $errors["areas.{$index}.nivel_competencia_id"] = 'El nivel de competencia es requerido';
                }
            }
        }

        return $errors;
    }
}
