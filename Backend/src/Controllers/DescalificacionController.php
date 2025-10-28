<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Models\ReglaDescalificacion;
use ForwardSoft\Models\Descalificacion;
use ForwardSoft\Models\InscripcionArea;
use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;

class DescalificacionController
{
    private $reglaDescalificacionModel;
    private $descalificacionModel;
    private $inscripcionModel;

    public function __construct()
    {
        $this->reglaDescalificacionModel = new ReglaDescalificacion();
        $this->descalificacionModel = new Descalificacion();
        $this->inscripcionModel = new InscripcionArea();
    }

    /**
     * Obtener reglas de descalificación por área
     */
    public function getReglasPorArea()
    {
        try {
            $areaId = $_GET['area_id'] ?? null;
            
            if (!$areaId) {
                return Response::validationError(['area_id' => 'El ID del área es requerido']);
            }

            $reglas = $this->reglaDescalificacionModel->getByArea($areaId);
            
            return Response::success($reglas, 'Reglas de descalificación obtenidas exitosamente');
        } catch (\Exception $e) {
            error_log("Error en getReglasPorArea: " . $e->getMessage());
            return Response::serverError('Error al obtener reglas de descalificación');
        }
    }

    /**
     * Registrar descalificación
     */
    public function registrarDescalificacion()
    {
        try {
            $user = JWTManager::getCurrentUser();
            if (!$user) {
                return Response::unauthorized('Token inválido');
            }

            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validar datos requeridos
            $requiredFields = ['inscripcion_area_id', 'regla_descalificacion_id', 'motivo'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    return Response::validationError([$field => "El campo $field es requerido"]);
                }
            }

            // Verificar que la inscripción existe
            $inscripcion = $this->inscripcionModel->getById($input['inscripcion_area_id']);
            if (!$inscripcion) {
                return Response::validationError(['inscripcion_area_id' => 'La inscripción no existe']);
            }

            // Verificar que la regla existe
            $regla = $this->reglaDescalificacionModel->getById($input['regla_descalificacion_id']);
            if (!$regla) {
                return Response::validationError(['regla_descalificacion_id' => 'La regla de descalificación no existe']);
            }

            // Verificar que el usuario tiene permisos para descalificar en esta área
            if ($user['role'] === 'evaluador') {
                // Verificar que el evaluador tiene permisos para esta área
                // Aquí podrías agregar lógica adicional para verificar permisos específicos
            }

            // Preparar datos para la descalificación
            $data = [
                'inscripcion_area_id' => $input['inscripcion_area_id'],
                'regla_descalificacion_id' => $input['regla_descalificacion_id'],
                'motivo' => $input['motivo'],
                'evaluador_id' => $user['role'] === 'evaluador' ? $user['id'] : null,
                'coordinador_id' => $user['role'] === 'coordinador' ? $user['id'] : null
            ];

            $descalificacionId = $this->descalificacionModel->create($data);
            
            return Response::success([
                'id' => $descalificacionId,
                'inscripcion_area_id' => $input['inscripcion_area_id'],
                'regla' => $regla['nombre_regla'],
                'motivo' => $input['motivo']
            ], 'Descalificación registrada exitosamente');
        } catch (\Exception $e) {
            error_log("Error en registrarDescalificacion: " . $e->getMessage());
            return Response::serverError('Error al registrar descalificación');
        }
    }

    /**
     * Obtener descalificaciones por área
     */
    public function getDescalificacionesPorArea()
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

            // Limpiar filtros vacíos
            $filtros = array_filter($filtros, function($value) {
                return $value !== null && $value !== '';
            });

            $descalificaciones = $this->descalificacionModel->getByArea($areaId, $filtros);
            
            return Response::success($descalificaciones, 'Descalificaciones obtenidas exitosamente');
        } catch (\Exception $e) {
            error_log("Error en getDescalificacionesPorArea: " . $e->getMessage());
            return Response::serverError('Error al obtener descalificaciones');
        }
    }

    /**
     * Revocar descalificación
     */
    public function revocarDescalificacion()
    {
        try {
            $user = JWTManager::getCurrentUser();
            if (!$user) {
                return Response::unauthorized('Token inválido');
            }

            // Solo coordinadores y administradores pueden revocar descalificaciones
            if (!in_array($user['role'], ['coordinador', 'admin'])) {
                return Response::forbidden('No tienes permisos para revocar descalificaciones');
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $descalificacionId = $input['id'] ?? null;
            $motivoRevocacion = $input['motivo_revocacion'] ?? null;

            if (!$descalificacionId) {
                return Response::validationError(['id' => 'El ID de la descalificación es requerido']);
            }

            $resultado = $this->descalificacionModel->revocar($descalificacionId, $motivoRevocacion);
            
            if ($resultado) {
                return Response::success(null, 'Descalificación revocada exitosamente');
            } else {
                return Response::serverError('Error al revocar descalificación');
            }
        } catch (\Exception $e) {
            error_log("Error en revocarDescalificacion: " . $e->getMessage());
            return Response::serverError('Error al revocar descalificación');
        }
    }

    /**
     * Verificar descalificación automática por puntuación
     */
    public function verificarDescalificacionAutomatica()
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

            $reglaDescalificacion = $this->reglaDescalificacionModel->verificarDescalificacionPuntuacion($areaId, $puntuacion);
            
            if ($reglaDescalificacion) {
                return Response::success([
                    'debe_descalificar' => true,
                    'regla' => $reglaDescalificacion
                ], 'El participante debe ser descalificado por puntuación');
            } else {
                return Response::success([
                    'debe_descalificar' => false
                ], 'El participante no debe ser descalificado');
            }
        } catch (\Exception $e) {
            error_log("Error en verificarDescalificacionAutomatica: " . $e->getMessage());
            return Response::serverError('Error al verificar descalificación automática');
        }
    }

    /**
     * Obtener estadísticas de descalificaciones
     */
    public function getEstadisticas()
    {
        try {
            $areaId = $_GET['area_id'] ?? null;
            
            if (!$areaId) {
                return Response::validationError(['area_id' => 'El ID del área es requerido']);
            }

            $estadisticas = $this->descalificacionModel->getEstadisticas($areaId);
            
            return Response::success($estadisticas, 'Estadísticas obtenidas exitosamente');
        } catch (\Exception $e) {
            error_log("Error en getEstadisticas: " . $e->getMessage());
            return Response::serverError('Error al obtener estadísticas');
        }
    }
}
