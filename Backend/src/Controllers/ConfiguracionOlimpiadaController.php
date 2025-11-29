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

            
            $db = \ForwardSoft\Config\Database::getInstance();
            $stmt = $db->query("
                SELECT fecha_inicio, fecha_fin_extendida, fecha_fin_original, fecha_extension, justificacion_extension
                FROM cierre_fase_general 
                WHERE fase = 'clasificacion'
                ORDER BY id DESC LIMIT 1
            ");
            $cierreFase = $stmt->fetch();
            
            if ($cierreFase) {
                
                if (!empty($cierreFase['fecha_inicio'])) {
                    $config['clasificacion_fecha_inicio'] = $cierreFase['fecha_inicio'];
                }
                
                if (!empty($cierreFase['fecha_fin_extendida'])) {
                    $config['tiene_fecha_extendida'] = true;
                    $config['fecha_fin_extendida'] = $cierreFase['fecha_fin_extendida'];
                    $config['fecha_fin_original'] = $cierreFase['fecha_fin_original'];
                    $config['fecha_extension'] = $cierreFase['fecha_extension'];
                    $config['justificacion_extension'] = $cierreFase['justificacion_extension'];
                    
                    $config['clasificacion_fecha_fin'] = $cierreFase['fecha_fin_extendida'];
                } else {
                    $config['tiene_fecha_extendida'] = false;

                    if (!empty($cierreFase['fecha_fin_original'])) {
                        $config['clasificacion_fecha_fin'] = $cierreFase['fecha_fin_original'];
                    }
                }
            } else {
                $config['tiene_fecha_extendida'] = false;
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

            
            $fechaInicioGeneral = null;
            $fechaFinGeneral = null;
            
            if (isset($input['fecha_inicio']) && isset($input['fecha_fin'])) {
                $fechaInicioGeneral = new \DateTime($input['fecha_inicio']);
                $fechaFinGeneral = new \DateTime($input['fecha_fin']);
                
                if ($fechaInicioGeneral >= $fechaFinGeneral) {
                    Response::validationError(['fecha_fin' => 'La fecha de fin debe ser posterior a la fecha de inicio']);
                    return;
                }
            } else {
                
                $configExistente = $this->configModel->getConfiguracion();
                if ($configExistente) {
                    if (!empty($configExistente['fecha_inicio'])) {
                        $fechaInicioGeneral = new \DateTime($configExistente['fecha_inicio']);
                    }
                    if (!empty($configExistente['fecha_fin'])) {
                        $fechaFinGeneral = new \DateTime($configExistente['fecha_fin']);
                    }
                }
            }

            
            $db = \ForwardSoft\Config\Database::getInstance();
            $stmt = $db->query("
                SELECT fecha_fin_extendida
                FROM cierre_fase_general 
                WHERE fase = 'clasificacion'
                ORDER BY id DESC LIMIT 1
            ");
            $cierreFase = $stmt->fetch();
            $tieneFechaExtendida = $cierreFase && !empty($cierreFase['fecha_fin_extendida']);

           
            if (isset($input['clasificacion_fecha_inicio']) && isset($input['clasificacion_fecha_fin'])) {
                if (!empty($input['clasificacion_fecha_inicio']) && !empty($input['clasificacion_fecha_fin'])) {
                   
                    if ($tieneFechaExtendida && isset($input['clasificacion_fecha_fin'])) {
                        $fechaExtendida = new \DateTime($cierreFase['fecha_fin_extendida']);
                        $fechaNueva = new \DateTime($input['clasificacion_fecha_fin']);
                        
                       
                        if ($fechaExtendida->format('Y-m-d H:i:s') !== $fechaNueva->format('Y-m-d H:i:s')) {
                            Response::validationError(['clasificacion_fecha_fin' => 'No se puede modificar la fecha de fin de clasificación porque existe una fecha extendida. Use la opción "Extender Fecha de Cierre" en la página de Cierre de Fase.']);
                            return;
                        }
                    }
                    
                    $clasifInicio = new \DateTime($input['clasificacion_fecha_inicio']);
                    $clasifFin = new \DateTime($input['clasificacion_fecha_fin']);
                    
                    if ($clasifInicio >= $clasifFin) {
                        Response::validationError(['clasificacion_fecha_fin' => 'La fecha de fin de clasificación debe ser posterior a la fecha de inicio']);
                        return;
                    }
                    
                    
                    if ($fechaInicioGeneral && $fechaFinGeneral) {
                        if ($clasifInicio < $fechaInicioGeneral) {
                            Response::validationError(['clasificacion_fecha_inicio' => 'La fecha de inicio de clasificación debe estar dentro del periodo general de la olimpiada']);
                            return;
                        }
                        if ($clasifFin > $fechaFinGeneral) {
                            Response::validationError(['clasificacion_fecha_fin' => 'La fecha de fin de clasificación debe estar dentro del periodo general de la olimpiada']);
                            return;
                        }
                    }
                }
            }

            
            if (isset($input['final_fecha_inicio']) && isset($input['final_fecha_fin'])) {
                if (!empty($input['final_fecha_inicio']) && !empty($input['final_fecha_fin'])) {
                    $finalInicio = new \DateTime($input['final_fecha_inicio']);
                    $finalFin = new \DateTime($input['final_fecha_fin']);
                    
                    if ($finalInicio >= $finalFin) {
                        Response::validationError(['final_fecha_fin' => 'La fecha de fin de la fase final debe ser posterior a la fecha de inicio']);
                        return;
                    }
                    
                   
                    if ($fechaInicioGeneral && $fechaFinGeneral) {
                        if ($finalInicio < $fechaInicioGeneral) {
                            Response::validationError(['final_fecha_inicio' => 'La fecha de inicio de la fase final debe estar dentro del periodo general de la olimpiada']);
                            return;
                        }
                        if ($finalFin > $fechaFinGeneral) {
                            Response::validationError(['final_fecha_fin' => 'La fecha de fin de la fase final debe estar dentro del periodo general de la olimpiada']);
                            return;
                        }
                    }
                }
            }

            $id = $this->configModel->updateConfiguracion($input);

            
            if (isset($input['clasificacion_fecha_inicio']) || isset($input['clasificacion_fecha_fin'])) {
                $db = \ForwardSoft\Config\Database::getInstance();
                
                
                $stmt = $db->query("
                    SELECT id, fecha_fin_extendida, estado
                    FROM cierre_fase_general 
                    WHERE fase = 'clasificacion'
                    ORDER BY id DESC LIMIT 1
                ");
                $cierreFase = $stmt->fetch();
                
                if ($cierreFase) {
                    
                    $puedeActualizar = !in_array($cierreFase['estado'], ['cerrada_general', 'cerrada_automatica']) && empty($cierreFase['fecha_fin_extendida']);
                    
                    if ($puedeActualizar) {
                        $updateFields = [];
                        $params = [];
                        
                        if (isset($input['clasificacion_fecha_inicio'])) {
                            $updateFields[] = "fecha_inicio = ?";
                            $params[] = $input['clasificacion_fecha_inicio'];
                            
                            
                            $fechaInicio = new \DateTime($input['clasificacion_fecha_inicio']);
                            $estado = $fechaInicio->getTimestamp() <= time() ? 'activa' : 'pendiente';
                            $updateFields[] = "estado = ?";
                            $params[] = $estado;
                        }
                        
                        if (isset($input['clasificacion_fecha_fin'])) {
                            $updateFields[] = "fecha_fin_original = ?";
                            $params[] = $input['clasificacion_fecha_fin'];
                           
                            $updateFields[] = "fecha_fin_extendida = ?";
                            $params[] = $input['clasificacion_fecha_fin'];
                        }
                        
                        if (!empty($updateFields)) {
                            $params[] = $cierreFase['id'];
                            $sql = "UPDATE cierre_fase_general SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
                            $db->query($sql, $params);
                            error_log("Sincronizado cierre_fase_general con configuración - Fechas actualizadas");
                        }
                    } else {
                        error_log("No se sincronizó cierre_fase_general: fase cerrada o tiene fecha extendida");
                    }
                } else {
                   
                    $fechaInicio = isset($input['clasificacion_fecha_inicio']) ? $input['clasificacion_fecha_inicio'] : null;
                    $fechaFin = isset($input['clasificacion_fecha_fin']) ? $input['clasificacion_fecha_fin'] : null;
                    
                    if ($fechaInicio && $fechaFin) {
                        $estado = (new \DateTime($fechaInicio))->getTimestamp() <= time() ? 'activa' : 'pendiente';
                        $db->query("
                            INSERT INTO cierre_fase_general (
                                fase, estado, fecha_inicio, fecha_fin_original, 
                                fecha_fin_extendida, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                        ", ['clasificacion', $estado, $fechaInicio, $fechaFin, $fechaFin]);
                        error_log("Creado registro cierre_fase_general desde configuración");
                    }
                }
            }

            Response::success(['id' => $id], 'Configuración actualizada');
        } catch (\Exception $e) {
            error_log('Error en updateConfiguracionGeneral: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            
            $errorMessage = $e->getMessage();
            
            Response::serverError('Error al actualizar configuración: ' . $errorMessage);
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

    public function getCronogramaPublico()
    {
        try {
            $cronograma = $this->configAreaModel->getCronogramaPublico();

            $formatted = array_map(function ($item) {
                return [
                    'area_competencia_id' => $item['area_competencia_id'],
                    'area_nombre' => $item['area_nombre'],
                    'area_descripcion' => $item['area_descripcion'],
                    'periodo_evaluacion_inicio' => $item['periodo_evaluacion_inicio'],
                    'periodo_evaluacion_fin' => $item['periodo_evaluacion_fin'],
                    'periodo_publicacion_inicio' => $item['periodo_publicacion_inicio'],
                    'periodo_publicacion_fin' => $item['periodo_publicacion_fin'],
                    'tiempo_evaluacion_minutos' => $item['tiempo_evaluacion_minutos'],
                    'periodo_evaluacion_final_inicio' => $item['periodo_evaluacion_final_inicio'] ?? null,
                    'periodo_evaluacion_final_fin' => $item['periodo_evaluacion_final_fin'] ?? null,
                    'periodo_publicacion_final_inicio' => $item['periodo_publicacion_final_inicio'] ?? null,
                    'periodo_publicacion_final_fin' => $item['periodo_publicacion_final_fin'] ?? null,
                    'tiempo_evaluacion_final_minutos' => $item['tiempo_evaluacion_final_minutos'] ?? null,
                ];
            }, $cronograma);

            Response::success($formatted, 'Cronograma público obtenido');
        } catch (\Exception $e) {
            error_log('Error en getCronogramaPublico: ' . $e->getMessage());
            Response::serverError('Error al obtener cronograma público: ' . $e->getMessage());
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

            
            if (isset($input['periodo_evaluacion_inicio']) && !empty($input['periodo_evaluacion_inicio'])) {
                $requiredClasificatoria = [
                    'periodo_evaluacion_inicio',
                    'periodo_evaluacion_fin',
                    'periodo_publicacion_inicio',
                    'periodo_publicacion_fin'
                ];

                foreach ($requiredClasificatoria as $field) {
                    if (empty($input[$field])) {
                        Response::validationError([$field => "El campo $field es requerido para la fase clasificatoria"]);
                        return;
                    }
                }

                $evalInicio = new \DateTime($input['periodo_evaluacion_inicio']);
                $evalFin = new \DateTime($input['periodo_evaluacion_fin']);
                $pubInicio = new \DateTime($input['periodo_publicacion_inicio']);
                $pubFin = new \DateTime($input['periodo_publicacion_fin']);

                if ($evalInicio >= $evalFin) {
                    Response::validationError(['periodo_evaluacion_fin' => 'La fecha de fin de evaluación debe ser posterior a la fecha de inicio']);
                    return;
                }

                if ($pubInicio >= $pubFin) {
                    Response::validationError(['periodo_publicacion_fin' => 'La fecha de fin de publicación debe ser posterior a la fecha de inicio']);
                    return;
                }

                if ($evalFin > $pubInicio) {
                    Response::validationError(['periodo_publicacion_inicio' => 'El periodo de evaluación debe terminar antes del periodo de publicación']);
                    return;
                }
            }

          
            if (isset($input['periodo_evaluacion_final_inicio']) && !empty($input['periodo_evaluacion_final_inicio'])) {
                $requiredFinal = [
                    'periodo_evaluacion_final_inicio',
                    'periodo_evaluacion_final_fin',
                    'periodo_publicacion_final_inicio',
                    'periodo_publicacion_final_fin'
                ];

                foreach ($requiredFinal as $field) {
                    if (empty($input[$field])) {
                        Response::validationError([$field => "El campo $field es requerido para la fase final"]);
                        return;
                    }
                }

                $evalFinalInicio = new \DateTime($input['periodo_evaluacion_final_inicio']);
                $evalFinalFin = new \DateTime($input['periodo_evaluacion_final_fin']);
                $pubFinalInicio = new \DateTime($input['periodo_publicacion_final_inicio']);
                $pubFinalFin = new \DateTime($input['periodo_publicacion_final_fin']);

                if ($evalFinalInicio >= $evalFinalFin) {
                    Response::validationError(['periodo_evaluacion_final_fin' => 'La fecha de fin de evaluación debe ser posterior a la fecha de inicio']);
                    return;
                }

                if ($pubFinalInicio >= $pubFinalFin) {
                    Response::validationError(['periodo_publicacion_final_fin' => 'La fecha de fin de publicación debe ser posterior a la fecha de inicio']);
                    return;
                }

                if ($evalFinalFin > $pubFinalInicio) {
                    Response::validationError(['periodo_publicacion_final_inicio' => 'El periodo de evaluación debe terminar antes del periodo de publicación']);
                    return;
                }
            }

            $result = $this->configAreaModel->createOrUpdate($areaId, $input);
            
            Response::success($result, 'Configuración del área actualizada exitosamente');
        } catch (\Exception $e) {
            error_log('Error en updateConfiguracionPorArea: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            
            $errorMessage = $e->getMessage();
            if (strpos($errorMessage, 'Error en la consulta') !== false) {
                
                $errorMessage = $e->getMessage();
            }
            
            Response::serverError('Error al actualizar configuración del área: ' . $errorMessage);
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

