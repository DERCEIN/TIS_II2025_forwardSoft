<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Models\ConfiguracionOlimpiada;
use ForwardSoft\Models\ConfiguracionAreaEvaluacion;

class ConfiguracionOlimpiadaController
{
    private $configModel;
    private $configAreaModel;

    public function __construct()
    {
        $this->configModel = new ConfiguracionOlimpiada();
        $this->configAreaModel = new ConfiguracionAreaEvaluacion();
    }

    
    public function getConfiguracion()
    {
        try {
            $config = $this->configModel->getConfiguracion();
            
            if (!$config) {
                Response::notFound('No se encontró configuración');
                return;
            }

            Response::success($config, 'Configuración obtenida');
        } catch (\Exception $e) {
            error_log('Error en getConfiguracion: ' . $e->getMessage());
            Response::serverError('Error al obtener configuración: ' . $e->getMessage());
        }
    }

    
    public function updateConfiguracionGeneral()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            
            if ($currentUser['role'] !== 'admin') {
                Response::forbidden('Solo los administradores pueden modificar la configuración');
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            
            if (isset($input['nombre']) || isset($input['fecha_inicio']) || isset($input['fecha_fin'])) {
                if (empty($input['nombre']) || empty($input['fecha_inicio']) || empty($input['fecha_fin'])) {
                    Response::error('Campos requeridos: nombre, fecha_inicio, fecha_fin');
                    return;
                }
            }

            $id = $this->configModel->updateConfiguracion($input);

            Response::success(['id' => $id], 'Configuración actualizada');
        } catch (\Exception $e) {
            error_log('Error en updateConfiguracionGeneral: ' . $e->getMessage());
            Response::serverError('Error al actualizar configuración: ' . $e->getMessage());
        }
    }

    
    public function getConfiguracionesPorArea()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            
            if ($currentUser['role'] !== 'admin') {
                Response::forbidden('Solo los administradores pueden ver la configuración');
                return;
            }

            $configuraciones = $this->configAreaModel->getAllWithAreaInfo();
            Response::success($configuraciones, 'Configuraciones por área obtenidas');
        } catch (\Exception $e) {
            error_log('Error en getConfiguracionesPorArea: ' . $e->getMessage());
            Response::serverError('Error al obtener configuraciones por área: ' . $e->getMessage());
        }
    }

  
    public function getConfiguracionPorArea()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            
            if ($currentUser['role'] !== 'admin') {
                Response::forbidden('Solo los administradores pueden ver la configuración');
                return;
            }

            $areaId = $_GET['area_id'] ?? null;
            
            if (!$areaId || !is_numeric($areaId)) {
                Response::validationError(['area_id' => 'El ID del área es requerido']);
                return;
            }

            $config = $this->configAreaModel->getByAreaId($areaId);
            
            if (!$config) {
                Response::notFound('No se encontró configuración para esta área');
                return;
            }

            Response::success($config, 'Configuración del área obtenida');
        } catch (\Exception $e) {
            error_log('Error en getConfiguracionPorArea: ' . $e->getMessage());
            Response::serverError('Error al obtener configuración del área: ' . $e->getMessage());
        }
    }

   
    public function updateConfiguracionPorArea()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            
            if ($currentUser['role'] !== 'admin') {
                Response::forbidden('Solo los administradores pueden modificar la configuración');
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                Response::validationError(['general' => 'Datos de entrada inválidos']);
                return;
            }

            $areaId = $input['area_competencia_id'] ?? null;
            
            if (!$areaId || !is_numeric($areaId)) {
                Response::validationError(['area_competencia_id' => 'El ID del área es requerido']);
                return;
            }

            
            $required = [
                'periodo_evaluacion_inicio',
                'periodo_evaluacion_fin',
                'periodo_publicacion_inicio',
                'periodo_publicacion_fin'
            ];

            foreach ($required as $field) {
                if (empty($input[$field])) {
                    Response::validationError([$field => "El campo $field es requerido"]);
                    return;
                }
            }

            
            if ($input['periodo_evaluacion_inicio'] >= $input['periodo_evaluacion_fin']) {
                Response::validationError(['periodo_evaluacion' => 'La fecha de inicio debe ser anterior a la fecha de fin']);
                return;
            }

            if ($input['periodo_publicacion_inicio'] >= $input['periodo_publicacion_fin']) {
                Response::validationError(['periodo_publicacion' => 'La fecha de inicio de publicación debe ser anterior a la fecha de fin']);
                return;
            }

            if ($input['periodo_evaluacion_fin'] > $input['periodo_publicacion_inicio']) {
                Response::validationError(['periodos' => 'El periodo de evaluación debe terminar antes del periodo de publicación']);
                return;
            }

            $result = $this->configAreaModel->createOrUpdate($areaId, $input);
            
            Response::success($result, 'Configuración del área actualizada exitosamente');
        } catch (\Exception $e) {
            error_log('Error en updateConfiguracionPorArea: ' . $e->getMessage());
            Response::serverError('Error al actualizar configuración del área: ' . $e->getMessage());
        }
    }

   
    public function validarChoquesHorarios()
    {
        try {
            $currentUser = JWTManager::getCurrentUser();
            
            if (!in_array($currentUser['role'], ['admin', 'coordinador'])) {
                Response::forbidden('No tienes permiso para validar choques de horarios');
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['area_ids']) || !is_array($input['area_ids'])) {
                Response::validationError(['area_ids' => 'Se requiere un array de IDs de áreas']);
                return;
            }

            if (count($input['area_ids']) < 2) {
                Response::success(['conflictos' => []], 'No hay suficientes áreas para validar choques');
                return;
            }

            $conflictos = $this->configAreaModel->validarChoquesHorarios($input['area_ids']);
            
            Response::success([
                'conflictos' => $conflictos,
                'tiene_conflictos' => count($conflictos) > 0
            ], count($conflictos) > 0 ? 'Se encontraron conflictos de horarios' : 'No hay conflictos de horarios');
        } catch (\Exception $e) {
            error_log('Error en validarChoquesHorarios: ' . $e->getMessage());
            Response::serverError('Error al validar choques de horarios: ' . $e->getMessage());
        }
    }
}

