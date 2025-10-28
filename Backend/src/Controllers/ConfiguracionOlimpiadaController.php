<?php

namespace ForwardSoft\Controllers;

use ForwardSoft\Utils\Response;
use ForwardSoft\Utils\JWTManager;
use ForwardSoft\Models\ConfiguracionOlimpiada;

class ConfiguracionOlimpiadaController
{
    private $configModel;

    public function __construct()
    {
        $this->configModel = new ConfiguracionOlimpiada();
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
}

