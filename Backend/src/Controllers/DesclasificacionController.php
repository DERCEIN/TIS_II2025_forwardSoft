<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Models\ReglaDesclasificacion;
use ForwardSoft\Models\Desclasificacion;
use ForwardSoft\Models\InscripcionArea;
use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;

class DesclasificacionController
{
    private $reglaDesclasificacionModel;
    private $desclasificacionModel;
    private $inscripcionModel;

    public function __construct()
    {
        $this->reglaDesclasificacionModel = new ReglaDesclasificacion();
        $this->desclasificacionModel = new Desclasificacion();
        $this->inscripcionModel = new InscripcionArea();
    }


    public function getReglasPorArea()
    {
        try {
            $areaId = $_GET['area_id'] ?? null;
            
            if (!$areaId) {
                return Response::validationError(['area_id' => 'El ID del área es requerido']);
            }

            $reglas = $this->reglaDesclasificacionModel->getByArea($areaId);
            
            return Response::success($reglas, 'Reglas de desclasificación obtenidas exitosamente');
        } catch (\Exception $e) {
            error_log("Error en getReglasPorArea: " . $e->getMessage());
            return Response::serverError('Error al obtener reglas de desclasificación');
        }
    }

   
    public function registrarDesclasificacion()
    {
        try {
            $user = JWTManager::getCurrentUser();
            if (!$user) {
                return Response::unauthorized('Token inválido');
            }

            $input = json_decode(file_get_contents('php://input'), true);
            
           
            $requiredFields = ['inscripcion_area_id', 'regla_desclasificacion_id', 'motivo'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    return Response::validationError([$field => "El campo $field es requerido"]);
                }
            }

            
            $inscripcion = $this->inscripcionModel->getById($input['inscripcion_area_id']);
            if (!$inscripcion) {
                return Response::validationError(['inscripcion_area_id' => 'La inscripción no existe']);
            }

            
            $regla = $this->reglaDesclasificacionModel->getById($input['regla_desclasificacion_id']);
            if (!$regla) {
                return Response::validationError(['regla_desclasificacion_id' => 'La regla de desclasificación no existe']);
            }

            
            if ($user['role'] === 'evaluador') {
            }

            
            $data = [
                'inscripcion_area_id' => $input['inscripcion_area_id'],
                'regla_desclasificacion_id' => $input['regla_desclasificacion_id'],
                'motivo' => $input['motivo'],
                'evaluador_id' => $user['role'] === 'evaluador' ? $user['id'] : null,
                'coordinador_id' => $user['role'] === 'coordinador' ? $user['id'] : null
            ];

            $desclasificacionId = $this->desclasificacionModel->create($data);
            
            return Response::success([
                'id' => $desclasificacionId,
                'inscripcion_area_id' => $input['inscripcion_area_id'],
                'regla' => $regla['nombre_regla'],
                'motivo' => $input['motivo']
            ], 'Descalificación registrada exitosamente');
        } catch (\Exception $e) {
            error_log("Error en registrarDescalificacion: " . $e->getMessage());
            return Response::serverError('Error al registrar desclasificación');
        }
    }

    
    public function getDesclasificacionesPorArea()
    {
        try {
            $areaId = $_GET['area_id'] ?? null;
            
            if (!$areaId) {
                return Response::validationError(['area_id' => 'El ID del área es requerido']);
            }

            $filtros = [
                'tipo' => $_GET['tipo'] ?? null,
                'nivel_id' => $_GET['nivel_id'] ?? null,
                'departamento_id' => $_GET['departamento_id'] ?? null
            ];

            
            $filtros = array_filter($filtros, function($value) {
                return $value !== null && $value !== '';
            });

            $desclasificaciones = $this->desclasificacionModel->getByArea($areaId, $filtros);
            
            return Response::success($desclasificaciones, 'Descalificaciones obtenidas exitosamente');
        } catch (\Exception $e) {
            error_log("Error en getDescalificacionesPorArea: " . $e->getMessage());
            return Response::serverError('Error al obtener desclasificaciones');
        }
    }

   
    public function revocarDesclasificacion()
    {
        try {
            $user = JWTManager::getCurrentUser();
            if (!$user) {
                return Response::unauthorized('Token inválido');
            }

            
            if (!in_array($user['role'], ['coordinador', 'admin'])) {
                return Response::forbidden('No tienes permisos para revocar desclasificaciones');
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $desclasificacionId = $input['id'] ?? null;
            $motivoRevocacion = $input['motivo_revocacion'] ?? null;

            if (!$desclasificacionId) {
                return Response::validationError(['id' => 'El ID de la desclasificación es requerido']);
            }

            $resultado = $this->desclasificacionModel->revocar($desclasificacionId, $motivoRevocacion);
            
            if ($resultado) {
                return Response::success(null, 'Descalificación revocada exitosamente');
            } else {
                return Response::serverError('Error al revocar desclasificación');
            }
        } catch (\Exception $e) {
            error_log("Error en revocarDescalificacion: " . $e->getMessage());
            return Response::serverError('Error al revocar desclasificación');
        }
    }

    
    public function verificarDesclasificacionAutomatica()
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $areaId = $input['area_id'] ?? null;
            $puntuacion = $input['puntuacion'] ?? null;
            
            if (!$areaId || $puntuacion === null) {
                return Response::validationError([
                    'area_id' => 'El ID del área es requerido',
                    'puntuacion' => 'La puntuación es requerida'
                ]);
            }

            $reglaDesclasificacion = $this->reglaDesclasificacionModel->verificarDesclasificacionPuntuacion($areaId, $puntuacion);
            
            if ($reglaDesclasificacion) {
                return Response::success([
                    'debe_descalificar' => true,
                    'regla' => $reglaDesclasificacion
                ], 'El participante debe ser descalificado por puntuación');
            } else {
                return Response::success([
                    'debe_descalificar' => false
                ], 'El participante no debe ser descalificado');
            }
        } catch (\Exception $e) {
            error_log("Error en verificarDescalificacionAutomatica: " . $e->getMessage());
            return Response::serverError('Error al verificar desclasificación automática');
        }
    }

   
    public function getEstadisticas()
    {
        try {
            $areaId = $_GET['area_id'] ?? null;
            
            if (!$areaId) {
                return Response::validationError(['area_id' => 'El ID del área es requerido']);
            }

            $estadisticas = $this->desclasificacionModel->getEstadisticas($areaId);
            
            return Response::success($estadisticas, 'Estadísticas obtenidas exitosamente');
        } catch (\Exception $e) {
            error_log("Error en getEstadisticas: " . $e->getMessage());
            return Response::serverError('Error al obtener estadísticas');
        }
    }
}
