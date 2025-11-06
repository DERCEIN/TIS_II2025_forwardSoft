<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Utils\AuditService;
use ForwardSoft\Utils\LogCambiosNotas;
use ForwardSoft\Models\EvaluacionClasificacion;
use ForwardSoft\Models\EvaluacionFinal;
use ForwardSoft\Models\InscripcionArea;
use ForwardSoft\Models\ResultadoFinal;
use ForwardSoft\Models\ConfiguracionMedallero;
use ForwardSoft\Models\ConfiguracionAreaEvaluacion;
use ForwardSoft\Models\ConfiguracionOlimpiada;
use ForwardSoft\Models\NoClasificado;

class EvaluacionController
{
    private $evalClasificacionModel;
    private $evalFinalModel;
    private $inscripcionModel;
    private $resultadoModel;
    private $medalleroModel;
    private $pdo;

    public function __construct()
    {
        try {
            error_log("EvaluacionController::__construct - Creating models");
            $this->evalClasificacionModel = new EvaluacionClasificacion();
            error_log("EvaluacionController::__construct - EvaluacionClasificacion created");
            $this->evalFinalModel = new EvaluacionFinal();
            error_log("EvaluacionController::__construct - EvaluacionFinal created");
            $this->inscripcionModel = new InscripcionArea();
            error_log("EvaluacionController::__construct - InscripcionArea created");
            $this->resultadoModel = new ResultadoFinal();
            error_log("EvaluacionController::__construct - ResultadoFinal created");
            $this->medalleroModel = new ConfiguracionMedallero();
            error_log("EvaluacionController::__construct - ConfiguracionMedallero created");
            $this->pdo = \ForwardSoft\Config\Database::getInstance()->getConnection();
            error_log("EvaluacionController::__construct - PDO connection created");
        } catch (\Exception $e) {
            error_log("EvaluacionController::__construct - Error: " . $e->getMessage());
            throw $e;
        }
    }

    public function evaluarClasificacion()
    {
        try {
            error_log("EvaluacionController::evaluarClasificacion - Method called");
            $input = json_decode(file_get_contents('php://input'), true);
            error_log("EvaluacionController::evaluarClasificacion - Input: " . print_r($input, true));
            
            if (!$input) {
                Response::validationError(['general' => 'Datos de entrada inválidos']);
            }

        $errors = $this->validateEvaluacionData($input);
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        $currentUser = JWTManager::getCurrentUser();
        
        try {
            
            if (!$this->canEvaluate($currentUser['id'], $input['inscripcion_area_id'])) {
                Response::forbidden('No tienes permisos para evaluar esta inscripción');
            }

            
            $existingEval = $this->evalClasificacionModel->findByInscripcionAndEvaluador(
                $input['inscripcion_area_id'], 
                $currentUser['id']
            );
            
            
            if ($existingEval && $existingEval['modificaciones_count'] >= 1) {
                Response::validationError(['general' => 'No se puede modificar la nota más de una vez']);
            }

            
            $isFinal = false;
            error_log("EvaluacionController::evaluarClasificacion - is_final raw value: " . var_export($input['is_final'], true));
            error_log("EvaluacionController::evaluarClasificacion - is_final type: " . gettype($input['is_final']));
            
            if (isset($input['is_final'])) {
                if (is_bool($input['is_final'])) {
                    $isFinal = $input['is_final'];
                } elseif (is_string($input['is_final'])) {
                    $isFinal = in_array(strtolower($input['is_final']), ['true', '1', 'yes', 'on']);
                } elseif (is_numeric($input['is_final'])) {
                    $isFinal = (bool)$input['is_final'];
                }
            }
            
            error_log("EvaluacionController::evaluarClasificacion - is_final converted: " . var_export($isFinal, true));

            $evaluacionData = [
                'inscripcion_area_id' => (int)$input['inscripcion_area_id'],
                'evaluador_id' => (int)$currentUser['id'],
                'puntuacion' => (float)$input['puntuacion'],
                'fecha_evaluacion' => date('Y-m-d H:i:s'),
                'is_final' => $isFinal
            ];
            
            
            if (!empty($input['observaciones']) && trim($input['observaciones']) !== '') {
                $evaluacionData['observaciones'] = trim($input['observaciones']);
            }

            if ($existingEval) {
                
                $this->evalClasificacionModel->update($existingEval['id'], $evaluacionData);
                $evaluacionId = $existingEval['id'];
            } else {
                
                $evaluacionId = $this->evalClasificacionModel->create($evaluacionData);
            }

           
            
            $puntuacion = (float)$input['puntuacion'];
            $estadoInscripcion = 'evaluado';
            
            
            $configModel = new ConfiguracionOlimpiada();
            $config = $configModel->getConfiguracion();
            $puntuacionMinima = 51.0; 
            if ($config && isset($config['clasificacion_puntuacion_minima'])) {
                $puntuacionMinima = (float)$config['clasificacion_puntuacion_minima'];
            }
            
           
            if ($puntuacion < $puntuacionMinima) {
                $noClasificadoModel = new NoClasificado();
                try {
                    $noClasificadoModel->create([
                        'inscripcion_area_id' => (int)$input['inscripcion_area_id'],
                        'puntuacion' => $puntuacion,
                        'puntuacion_minima_requerida' => $puntuacionMinima,
                        'motivo' => "Puntuación {$puntuacion} menor a la mínima requerida de {$puntuacionMinima} puntos",
                        'evaluador_id' => (int)$currentUser['id'],
                        'fase' => 'clasificacion'
                    ]);
                    $estadoInscripcion = 'no_clasificado';
                } catch (\Exception $e) {
                    error_log("Error al registrar no clasificado: " . $e->getMessage());
                    
                    $estadoInscripcion = 'no_clasificado';
                }
            } else {
                
                $noClasificadoModel = new NoClasificado();
                if ($noClasificadoModel->estaNoClasificado((int)$input['inscripcion_area_id'], 'clasificacion')) {
                    try {
                        $noClasificadoModel->eliminar((int)$input['inscripcion_area_id'], 'clasificacion');
                    } catch (\Exception $e) {
                        error_log("Error al eliminar registro de no clasificado: " . $e->getMessage());
                    }
                }
            }
            
            
            $updateData = ['estado' => $estadoInscripcion];
            
            try {
                $this->inscripcionModel->update($input['inscripcion_area_id'], $updateData);
            } catch (\Exception $e) {
                
                error_log("Error actualizando inscripción (intentando sin updated_at): " . $e->getMessage());
                $this->inscripcionModel->update($input['inscripcion_area_id'], ['estado' => $estadoInscripcion]);
            }

            $evaluacion = $this->evalClasificacionModel->findById($evaluacionId);
            
            
            $datosNuevos = [
                'puntuacion' => (float)$input['puntuacion'],
                'observaciones' => $input['observaciones'] ?? null,
                'is_final' => $isFinal
            ];
            
            $datosAnteriores = null;
            if ($existingEval) {
                $datosAnteriores = [
                    'puntuacion' => (float)$existingEval['puntuacion'],
                    'observaciones' => $existingEval['observaciones'],
                    'is_final' => $existingEval['is_final'] === 't' || $existingEval['is_final'] === true
                ];
            }
            
            AuditService::logEvaluacionClasificacion(
                $currentUser['id'],
                $currentUser['nombre'] ?? $currentUser['email'],
                $evaluacionId,
                $input['inscripcion_area_id'],
                $datosNuevos,
                $datosAnteriores
            );
            
            
            if ($existingEval) {
                error_log("Registrando cambio de nota - Evaluacion ID: $evaluacionId");
                
                
                $sql = "SELECT o.id as olimpista_id, o.nombre_completo as olimpista_nombre, 
                               ac.id as area_id, ac.nombre as area_nombre,
                               nc.id as nivel_id, nc.nombre as nivel_nombre
                        FROM inscripciones_areas ia
                        JOIN olimpistas o ON o.id = ia.olimpista_id
                        JOIN areas_competencia ac ON ac.id = ia.area_competencia_id
                        JOIN niveles_competencia nc ON nc.id = ia.nivel_competencia_id
                        WHERE ia.id = ?";
                
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$input['inscripcion_area_id']]);
                $datosOlimpista = $stmt->fetch(\PDO::FETCH_ASSOC);
                
                error_log("Datos olimpista: " . json_encode($datosOlimpista));
                
                if ($datosOlimpista) {
                    $motivo = $input['motivo_modificacion'] ?? 'Modificación de nota';
                    error_log("Registrando cambio con motivo: $motivo");
                    
                    LogCambiosNotas::registrarCambio(
                        $evaluacionId,
                        $currentUser['id'],
                        $currentUser['nombre'] ?? $currentUser['email'],
                        $datosOlimpista['olimpista_id'],
                        $datosOlimpista['olimpista_nombre'],
                        $datosOlimpista['area_id'],
                        $datosOlimpista['area_nombre'],
                        $datosOlimpista['nivel_id'],
                        $datosOlimpista['nivel_nombre'],
                        (float)$existingEval['puntuacion'],
                        (float)$input['puntuacion'],
                        $existingEval['observaciones'],
                        $input['observaciones'] ?? null,
                        $motivo
                    );
                    error_log("Cambio registrado exitosamente");
                } else {
                    error_log("No se encontraron datos del olimpista para el log");
                }
            } else {
                error_log("No es una modificación, no se registra en log de cambios");
            }
            
            Response::success($evaluacion, 'Evaluación registrada exitosamente');
            
        } catch (\Exception $e) {
            error_log("Error al registrar evaluación: " . $e->getMessage());
            Response::serverError('Error al registrar la evaluación');
        }
        } catch (\Exception $e) {
            error_log("Error en evaluarClasificacion: " . $e->getMessage());
            Response::serverError('Error interno del servidor');
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
            
            if (!$this->canEvaluate($currentUser['id'], $input['inscripcion_area_id'])) {
                Response::forbidden('No tienes permisos para evaluar esta inscripción');
            }

            
            $inscripcion = $this->inscripcionModel->findById($input['inscripcion_area_id']);
            if (!$inscripcion || $inscripcion['estado'] !== 'clasificado') {
                Response::validationError(['inscripcion_area_id' => 'La inscripción debe estar clasificada para la evaluación final']);
            }

            
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
                
                $this->evalFinalModel->update($existingEval['id'], $evaluacionData);
                $evaluacionId = $existingEval['id'];
            } else {
                
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
        
        
        if (!$this->isResponsableAcademico($currentUser['id'], $areaId)) {
            Response::forbidden('No tienes permisos para calcular clasificados');
        }

        try {
            $clasificados = $this->evalClasificacionModel->calcularClasificados($areaId, $nivelId);
            
            
            
            foreach ($clasificados as $clasificado) {
                $inscripcionId = $clasificado['inscripcion_area_id'];
                $inscripcion = $this->inscripcionModel->getById($inscripcionId);
                
                
                if ($inscripcion && !in_array($inscripcion['estado'], ['desclasificado', 'no_clasificado'])) {
                    $this->inscripcionModel->update($inscripcionId, [
                        'estado' => 'clasificado',
                        'updated_at' => date('Y-m-d H:i:s')
                    ]);
                }
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
        
       
        if (!$this->isResponsableAcademico($currentUser['id'], $areaId)) {
            Response::forbidden('No tienes permisos para calcular premiados');
        }

        try {
            
            $medalleroConfig = $this->medalleroModel->getByAreaAndLevel($areaId, $nivelId);
            
            $premiados = $this->evalFinalModel->calcularPremiados($areaId, $nivelId, $medalleroConfig);
            
            
            foreach ($premiados as $index => $premiado) {
                $this->resultadoModel->create([
                    'inscripcion_area_id' => $premiado['inscripcion_area_id'],
                    'fase' => 'premiacion',
                    'posicion' => $index + 1,
                    'medalla' => $premiado['medalla'],
                    'puntuacion_final' => $premiado['puntuacion_final']
                ]);

                
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

        if (empty($input['inscripcion_area_id']) || $input['inscripcion_area_id'] === '') {
            $errors['inscripcion_area_id'] = 'La inscripción es requerida';
        } elseif (!is_numeric($input['inscripcion_area_id'])) {
            $errors['inscripcion_area_id'] = 'La inscripción debe ser un número válido';
        }

        if (!isset($input['puntuacion']) || $input['puntuacion'] === '' || $input['puntuacion'] === null) {
            $errors['puntuacion'] = 'La puntuación es requerida';
        } elseif (!is_numeric($input['puntuacion']) || $input['puntuacion'] < 0 || $input['puntuacion'] > 100) {
            $errors['puntuacion'] = 'La puntuación debe ser un número entre 0 y 100';
        }

        return $errors;
    }

    private function canEvaluate($evaluadorId, $inscripcionId)
    {
        
        $inscripcion = $this->inscripcionModel->findById($inscripcionId);
        if (!$inscripcion) {
            return false;
        }

        
        $sql = "SELECT id, start_date, start_time, duration_days, status,
                       (start_date + (duration_days || ' days')::interval) AS end_datetime
                FROM permisos_evaluadores
                WHERE evaluador_id = :evaluadorId AND status = 'activo'
                ORDER BY start_date DESC, start_time DESC
                LIMIT 1";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':evaluadorId', $evaluadorId, \PDO::PARAM_INT);
        $stmt->execute();
        $permiso = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$permiso) {
            return false; // No tiene permiso activo
        }
        
        
        $now = new \DateTime();
        $startPermiso = new \DateTime($permiso['start_date'] . ' ' . $permiso['start_time']);
        $endPermiso = new \DateTime($permiso['end_datetime']);
        
        if ($now < $startPermiso || $now > $endPermiso) {
            return false; // Fuera del periodo asignado por el coordinador
        }

        // 3. Verificar que está dentro del periodo configurado para el área
        $configAreaModel = new ConfiguracionAreaEvaluacion();
        $configArea = $configAreaModel->getByAreaId($inscripcion['area_competencia_id']);
        
        if ($configArea) {
            $periodoInicio = new \DateTime($configArea['periodo_evaluacion_inicio']);
            $periodoFin = new \DateTime($configArea['periodo_evaluacion_fin']);
            
            if ($now < $periodoInicio || $now > $periodoFin) {
                return false; 
            }
        }

        return true;
    }

    private function isResponsableAcademico($userId, $areaId)
    {
        
        return true; 
    }

    
    public function confirmarCierreCalificacion()
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['area_id']) || !isset($input['nivel_id'])) {
                Response::validationError(['general' => 'Se requieren area_id y nivel_id']);
            }
            
            $areaId = (int)$input['area_id'];
            $nivelId = (int)$input['nivel_id'];
            $fase = $input['fase'] ?? 'clasificacion';
            
            $currentUser = JWTManager::getCurrentUser();
            
            
            $sql = "SELECT COUNT(*) as total_evaluaciones,
                           COUNT(CASE WHEN ec.puntuacion IS NOT NULL THEN 1 END) as evaluaciones_completas
                    FROM asignaciones_evaluacion aa
                    JOIN inscripciones_areas ia ON ia.id = aa.inscripcion_area_id
                    LEFT JOIN evaluaciones_clasificacion ec ON ec.inscripcion_area_id = ia.id AND ec.evaluador_id = ?
                    WHERE aa.evaluador_id = ? AND ia.area_competencia_id = ? AND ia.nivel_competencia_id = ? AND aa.fase = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$currentUser['id'], $currentUser['id'], $areaId, $nivelId, $fase]);
            $resultado = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if ($resultado['total_evaluaciones'] == 0) {
                Response::validationError(['general' => 'No tienes asignaciones en esta área y nivel']);
            }
            
            if ($resultado['evaluaciones_completas'] < $resultado['total_evaluaciones']) {
                $pendientes = $resultado['total_evaluaciones'] - $resultado['evaluaciones_completas'];
                Response::validationError(['general' => "Tienes {$pendientes} evaluaciones pendientes por completar"]);
            }
            
            
            $coordinadorController = new CoordinadorController();
            $listas = $coordinadorController->generarListasClasificacion($areaId, $nivelId, $fase);
            
            
            AuditService::logCierreCalificacion(
                $currentUser['id'],
                $currentUser['nombre'] ?? $currentUser['email'],
                $areaId,
                $nivelId,
                [
                    'fase' => $fase,
                    'total_evaluaciones' => $resultado['total_evaluaciones'],
                    'confirmado_por' => 'evaluador',
                    'listas_generadas' => $listas
                ]
            );
            
            Response::success([
                'mensaje' => 'Cierre de calificación confirmado exitosamente',
                'listas_generadas' => $listas,
                'evaluaciones_completas' => $resultado['evaluaciones_completas']
            ], 'Calificación cerrada y listas generadas');
            
        } catch (\Exception $e) {
            error_log('Error confirmando cierre de calificación: ' . $e->getMessage());
            Response::serverError('Error al confirmar cierre de calificación: ' . $e->getMessage());
        }
    }
}
