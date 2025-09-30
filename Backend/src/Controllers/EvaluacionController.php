<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Models\EvaluacionClasificacion;
use ForwardSoft\Models\EvaluacionFinal;
use ForwardSoft\Models\InscripcionArea;
use ForwardSoft\Models\ResultadoFinal;
use ForwardSoft\Models\ConfiguracionMedallero;

class EvaluacionController
{
    private $evalClasificacionModel;
    private $evalFinalModel;
    private $inscripcionModel;
    private $resultadoModel;
    private $medalleroModel;

    public function __construct()
    {
        $this->evalClasificacionModel = new EvaluacionClasificacion();
        $this->evalFinalModel = new EvaluacionFinal();
        $this->inscripcionModel = new InscripcionArea();
        $this->resultadoModel = new ResultadoFinal();
        $this->medalleroModel = new ConfiguracionMedallero();
    }

    public function evaluarClasificacion()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError(['general' => 'Datos de entrada inválidos']);
        }

        $errors = $this->validateEvaluacionData($input);
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        $currentUser = JWTManager::getCurrentUser();
        
        try {
            // Verificar que el evaluador puede evaluar esta inscripción
            if (!$this->canEvaluate($currentUser['id'], $input['inscripcion_area_id'])) {
                Response::forbidden('No tienes permisos para evaluar esta inscripción');
            }

            // Verificar si ya existe una evaluación
            $existingEval = $this->evalClasificacionModel->findByInscripcionAndEvaluador(
                $input['inscripcion_area_id'], 
                $currentUser['id']
            );

            $evaluacionData = [
                'inscripcion_area_id' => $input['inscripcion_area_id'],
                'evaluador_id' => $currentUser['id'],
                'puntuacion' => $input['puntuacion'],
                'observaciones' => $input['observaciones'] ?? null,
                'fecha_evaluacion' => date('Y-m-d H:i:s'),
                'is_final' => $input['is_final'] ?? false
            ];

            if ($existingEval) {
                // Actualizar evaluación existente
                $this->evalClasificacionModel->update($existingEval['id'], $evaluacionData);
                $evaluacionId = $existingEval['id'];
            } else {
                // Crear nueva evaluación
                $evaluacionId = $this->evalClasificacionModel->create($evaluacionData);
            }

            // Si es evaluación final, actualizar estado de la inscripción
            if ($input['is_final'] ?? false) {
                $this->inscripcionModel->update($input['inscripcion_area_id'], [
                    'estado' => 'evaluado',
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            }

            $evaluacion = $this->evalClasificacionModel->findById($evaluacionId);
            
            Response::success($evaluacion, 'Evaluación registrada exitosamente');
            
        } catch (\Exception $e) {
            error_log("Error al registrar evaluación: " . $e->getMessage());
            Response::serverError('Error al registrar la evaluación');
        }
    }

    public function evaluarFinal()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError(['general' => 'Datos de entrada inválidos']);
        }

        $errors = $this->validateEvaluacionData($input);
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        $currentUser = JWTManager::getCurrentUser();
        
        try {
            // Verificar que el evaluador puede evaluar esta inscripción
            if (!$this->canEvaluate($currentUser['id'], $input['inscripcion_area_id'])) {
                Response::forbidden('No tienes permisos para evaluar esta inscripción');
            }

            // Verificar que la inscripción esté clasificada
            $inscripcion = $this->inscripcionModel->findById($input['inscripcion_area_id']);
            if (!$inscripcion || $inscripcion['estado'] !== 'clasificado') {
                Response::validationError(['inscripcion_area_id' => 'La inscripción debe estar clasificada para la evaluación final']);
            }

            // Verificar si ya existe una evaluación final
            $existingEval = $this->evalFinalModel->findByInscripcionAndEvaluador(
                $input['inscripcion_area_id'], 
                $currentUser['id']
            );

            $evaluacionData = [
                'inscripcion_area_id' => $input['inscripcion_area_id'],
                'evaluador_id' => $currentUser['id'],
                'puntuacion' => $input['puntuacion'],
                'observaciones' => $input['observaciones'] ?? null,
                'fecha_evaluacion' => date('Y-m-d H:i:s')
            ];

            if ($existingEval) {
                // Actualizar evaluación existente
                $this->evalFinalModel->update($existingEval['id'], $evaluacionData);
                $evaluacionId = $existingEval['id'];
            } else {
                // Crear nueva evaluación
                $evaluacionId = $this->evalFinalModel->create($evaluacionData);
            }

            $evaluacion = $this->evalFinalModel->findById($evaluacionId);
            
            Response::success($evaluacion, 'Evaluación final registrada exitosamente');
            
        } catch (\Exception $e) {
            error_log("Error al registrar evaluación final: " . $e->getMessage());
            Response::serverError('Error al registrar la evaluación final');
        }
    }

    public function getEvaluacionesByArea($areaId)
    {
        $nivelId = $_GET['nivel_id'] ?? null;
        $currentUser = JWTManager::getCurrentUser();
        
        $evaluaciones = $this->evalClasificacionModel->getByAreaAndLevel($areaId, $nivelId, $currentUser['id']);
        
        Response::success($evaluaciones, 'Evaluaciones obtenidas');
    }

    public function getEvaluacionesFinalesByArea($areaId)
    {
        $nivelId = $_GET['nivel_id'] ?? null;
        $currentUser = JWTManager::getCurrentUser();
        
        $evaluaciones = $this->evalFinalModel->getByAreaAndLevel($areaId, $nivelId, $currentUser['id']);
        
        Response::success($evaluaciones, 'Evaluaciones finales obtenidas');
    }

    public function getEvaluacionesByInscripcion($inscripcionId)
    {
        $currentUser = JWTManager::getCurrentUser();
        
        $evaluaciones = [
            'clasificacion' => $this->evalClasificacionModel->getByInscripcion($inscripcionId),
            'final' => $this->evalFinalModel->getByInscripcion($inscripcionId)
        ];
        
        Response::success($evaluaciones, 'Evaluaciones de la inscripción obtenidas');
    }

    public function calcularClasificados($areaId, $nivelId = null)
    {
        $currentUser = JWTManager::getCurrentUser();
        
        // Verificar permisos de responsable académico
        if (!$this->isResponsableAcademico($currentUser['id'], $areaId)) {
            Response::forbidden('No tienes permisos para calcular clasificados');
        }

        try {
            $clasificados = $this->evalClasificacionModel->calcularClasificados($areaId, $nivelId);
            
            // Actualizar estados de las inscripciones
            foreach ($clasificados as $clasificado) {
                $this->inscripcionModel->update($clasificado['inscripcion_area_id'], [
                    'estado' => 'clasificado',
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            }
            
            Response::success($clasificados, 'Clasificados calculados exitosamente');
            
        } catch (\Exception $e) {
            error_log("Error al calcular clasificados: " . $e->getMessage());
            Response::serverError('Error al calcular clasificados');
        }
    }

    public function calcularPremiados($areaId, $nivelId = null)
    {
        $currentUser = JWTManager::getCurrentUser();
        
        // Verificar permisos de responsable académico
        if (!$this->isResponsableAcademico($currentUser['id'], $areaId)) {
            Response::forbidden('No tienes permisos para calcular premiados');
        }

        try {
            // Obtener configuración del medallero
            $medalleroConfig = $this->medalleroModel->getByAreaAndLevel($areaId, $nivelId);
            
            $premiados = $this->evalFinalModel->calcularPremiados($areaId, $nivelId, $medalleroConfig);
            
            // Guardar resultados finales
            foreach ($premiados as $index => $premiado) {
                $this->resultadoModel->create([
                    'inscripcion_area_id' => $premiado['inscripcion_area_id'],
                    'fase' => 'premiacion',
                    'posicion' => $index + 1,
                    'medalla' => $premiado['medalla'],
                    'puntuacion_final' => $premiado['puntuacion_final']
                ]);

                // Actualizar estado de la inscripción
                $this->inscripcionModel->update($premiado['inscripcion_area_id'], [
                    'estado' => 'premiado',
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            }
            
            Response::success($premiados, 'Premiados calculados exitosamente');
            
        } catch (\Exception $e) {
            error_log("Error al calcular premiados: " . $e->getMessage());
            Response::serverError('Error al calcular premiados');
        }
    }

    public function getResultadosFinales($areaId, $nivelId = null)
    {
        $fase = $_GET['fase'] ?? 'premiacion';
        
        $resultados = $this->resultadoModel->getByAreaAndLevel($areaId, $nivelId, $fase);
        
        Response::success($resultados, 'Resultados finales obtenidos');
    }

    public function getMedallero($areaId, $nivelId = null)
    {
        $medallero = $this->resultadoModel->getMedallero($areaId, $nivelId);
        
        Response::success($medallero, 'Medallero obtenido');
    }

    private function validateEvaluacionData($input)
    {
        $errors = [];

        if (empty($input['inscripcion_area_id'])) {
            $errors['inscripcion_area_id'] = 'La inscripción es requerida';
        }

        if (!isset($input['puntuacion']) || $input['puntuacion'] === '') {
            $errors['puntuacion'] = 'La puntuación es requerida';
        } elseif (!is_numeric($input['puntuacion']) || $input['puntuacion'] < 0 || $input['puntuacion'] > 100) {
            $errors['puntuacion'] = 'La puntuación debe ser un número entre 0 y 100';
        }

        return $errors;
    }

    private function canEvaluate($evaluadorId, $inscripcionId)
    {
        // Verificar si el evaluador está asignado a esta área/nivel
        $inscripcion = $this->inscripcionModel->findById($inscripcionId);
        if (!$inscripcion) {
            return false;
        }

        // Aquí implementarías la lógica para verificar si el evaluador
        // está asignado a esta área y nivel específico
        // Por ahora, asumimos que todos los evaluadores pueden evaluar
        return true;
    }

    private function isResponsableAcademico($userId, $areaId)
    {
        // Verificar si el usuario es responsable académico de esta área
        // Implementar consulta a la tabla responsables_academicos
        return true; // Por ahora, asumimos que todos los admins pueden hacer esto
    }
}
