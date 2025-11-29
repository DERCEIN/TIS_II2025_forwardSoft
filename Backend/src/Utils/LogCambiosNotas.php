<?php

namespace ForwardSoft\Utils;

use ForwardSoft\Config\Database;

class LogCambiosNotas
{
    private static $db;
    
    public static function init()
    {
        if (!self::$db) {
            self::$db = Database::getInstance()->getConnection();
        }
    }
    
    /**
     * Registrar un cambio de nota
     * @param string $tipoEvaluacion 'clasificacion' o 'final'
     */
    public static function registrarCambio($evaluacionId, $evaluadorId, $evaluadorNombre, $olimpistaId, $olimpistaNombre, $areaId, $areaNombre, $nivelId, $nivelNombre, $notaAnterior, $notaNueva, $observacionesAnterior = null, $observacionesNueva = null, $motivoCambio = null, $tipoEvaluacion = 'clasificacion')
    {
        self::init();
        
        // Validar tipo de evaluación
        if (!in_array($tipoEvaluacion, ['clasificacion', 'final'])) {
            error_log("LogCambiosNotas::registrarCambio - Tipo de evaluación inválido: $tipoEvaluacion");
            $tipoEvaluacion = 'clasificacion'; // Default por compatibilidad
        }
        
        error_log("LogCambiosNotas::registrarCambio - Iniciando registro de cambio");
        error_log("Datos: EvaluacionId=$evaluacionId, TipoEvaluacion=$tipoEvaluacion, EvaluadorId=$evaluadorId, OlimpistaId=$olimpistaId, Motivo=$motivoCambio");
        
        try {
            $sql = "INSERT INTO log_cambios_notas (
                evaluacion_id,
                tipo_evaluacion,
                evaluador_id,
                evaluador_nombre,
                olimpista_id,
                olimpista_nombre,
                area_competencia_id,
                area_nombre,
                nivel_competencia_id,
                nivel_nombre,
                nota_anterior,
                nota_nueva,
                observaciones_anterior,
                observaciones_nueva,
                motivo_cambio,
                ip_address,
                fecha_cambio,
                estado_aprobacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pendiente')";
            
            $stmt = self::$db->prepare($sql);
            $result = $stmt->execute([
                $evaluacionId,
                $tipoEvaluacion,
                $evaluadorId,
                $evaluadorNombre,
                $olimpistaId,
                $olimpistaNombre,
                $areaId,
                $areaNombre,
                $nivelId,
                $nivelNombre,
                $notaAnterior,
                $notaNueva,
                $observacionesAnterior,
                $observacionesNueva,
                $motivoCambio,
                self::getClientIP()
            ]);
            
            if ($result) {
                $cambioId = self::$db->lastInsertId();
                error_log("LogCambiosNotas::registrarCambio - Cambio registrado exitosamente con ID: $cambioId");
                return $cambioId;
            } else {
                error_log("LogCambiosNotas::registrarCambio - Error al ejecutar la consulta");
                return false;
            }
        } catch (\Exception $e) {
            error_log("Error en LogCambiosNotas::registrarCambio: " . $e->getMessage());
            return false;
        }
    }
    
    
    public static function getCambiosPorArea($areaId, $filtros = [])
    {
        self::init();
        
        error_log("LogCambiosNotas::getCambiosPorArea - AreaId: $areaId, Filtros: " . json_encode($filtros));
        
        $where = ["lcn.area_competencia_id = ?"];
        $params = [$areaId];
        
        if (!empty($filtros['nivel_id'])) {
            $where[] = "lcn.nivel_competencia_id = ?";
            $params[] = $filtros['nivel_id'];
        }
        
        if (!empty($filtros['fecha_desde'])) {
            $where[] = "lcn.fecha_cambio >= ?";
            $params[] = $filtros['fecha_desde'];
        }
        
        if (!empty($filtros['fecha_hasta'])) {
            $where[] = "lcn.fecha_cambio <= ?";
            $params[] = $filtros['fecha_hasta'];
        }
        
        if (!empty($filtros['evaluador_id'])) {
            $where[] = "lcn.evaluador_id = ?";
            $params[] = $filtros['evaluador_id'];
        }
        
        if (!empty($filtros['olimpista_id'])) {
            $where[] = "lcn.olimpista_id = ?";
            $params[] = $filtros['olimpista_id'];
        }
        
        if (!empty($filtros['estado_aprobacion']) && $filtros['estado_aprobacion'] !== 'todos') {
            $where[] = "lcn.estado_aprobacion = ?";
            $params[] = $filtros['estado_aprobacion'];
        }
        
        if (!empty($filtros['tipo_evaluacion']) && in_array($filtros['tipo_evaluacion'], ['clasificacion', 'final'])) {
            $where[] = "lcn.tipo_evaluacion = ?";
            $params[] = $filtros['tipo_evaluacion'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        $sql = "SELECT 
                    lcn.*,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre
                FROM log_cambios_notas lcn
                LEFT JOIN areas_competencia ac ON ac.id = lcn.area_competencia_id
                LEFT JOIN niveles_competencia nc ON nc.id = lcn.nivel_competencia_id
                WHERE {$whereClause}
                ORDER BY 
                    CASE WHEN lcn.estado_aprobacion = 'pendiente' THEN 0 ELSE 1 END,
                    lcn.fecha_cambio DESC";
        
        error_log("LogCambiosNotas::getCambiosPorArea - SQL: $sql");
        error_log("LogCambiosNotas::getCambiosPorArea - Params: " . json_encode($params));
        
        $stmt = self::$db->prepare($sql);
        $stmt->execute($params);
        
        $result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        error_log("LogCambiosNotas::getCambiosPorArea - Resultados encontrados: " . count($result));
        
        return $result;
    }
    
    
    public static function getEstadisticasCambios($areaId, $filtros = [])
    {
        self::init();
        
        $where = ["lcn.area_competencia_id = ?"];
        $params = [$areaId];
        
        if (!empty($filtros['nivel_id'])) {
            $where[] = "lcn.nivel_competencia_id = ?";
            $params[] = $filtros['nivel_id'];
        }
        
        if (!empty($filtros['fecha_desde'])) {
            $where[] = "lcn.fecha_cambio >= ?";
            $params[] = $filtros['fecha_desde'];
        }
        
        if (!empty($filtros['fecha_hasta'])) {
            $where[] = "lcn.fecha_cambio <= ?";
            $params[] = $filtros['fecha_hasta'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        $sql = "SELECT 
                    COUNT(*) as total_cambios,
                    COUNT(DISTINCT lcn.evaluador_id) as evaluadores_con_cambios,
                    COUNT(DISTINCT lcn.olimpista_id) as olimpistas_afectados,
                    AVG(lcn.nota_nueva - lcn.nota_anterior) as promedio_diferencia,
                    MIN(lcn.fecha_cambio) as primer_cambio,
                    MAX(lcn.fecha_cambio) as ultimo_cambio,
                    COUNT(CASE WHEN lcn.estado_aprobacion = 'pendiente' THEN 1 END) as cambios_pendientes,
                    COUNT(CASE WHEN lcn.estado_aprobacion = 'aprobado' THEN 1 END) as cambios_aprobados,
                    COUNT(CASE WHEN lcn.estado_aprobacion = 'rechazado' THEN 1 END) as cambios_rechazados,
                    CASE 
                        WHEN COUNT(CASE WHEN lcn.estado_aprobacion IN ('aprobado', 'rechazado') THEN 1 END) > 0
                        THEN ROUND((COUNT(CASE WHEN lcn.estado_aprobacion = 'aprobado' THEN 1 END) * 100.0) / 
                                   COUNT(CASE WHEN lcn.estado_aprobacion IN ('aprobado', 'rechazado') THEN 1 END), 2)
                        ELSE 0
                    END as porcentaje_aprobacion
                FROM log_cambios_notas lcn
                WHERE {$whereClause}";
        
        $stmt = self::$db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    
    private static function getClientIP()
    {
        
        $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP'];
        
        foreach ($ipKeys as $key) {
            if (isset($_SERVER[$key]) && !empty($_SERVER[$key])) {
                $ips = explode(',', $_SERVER[$key]);
                foreach ($ips as $ip) {
                    $ip = trim($ip);
                    
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        
        if (isset($_SERVER['REMOTE_ADDR'])) {
            $ip = $_SERVER['REMOTE_ADDR'];
           
            if (filter_var($ip, FILTER_VALIDATE_IP) !== false) {
                return $ip;
            }
        }
        
        
        return '127.0.0.1';
    }
    
    
    public static function getCambiosPendientes($areaId)
    {
        self::init();
        
        $sql = "SELECT COUNT(*) as total
                FROM log_cambios_notas
                WHERE area_competencia_id = ? AND estado_aprobacion = 'pendiente'";
        
        $stmt = self::$db->prepare($sql);
        $stmt->execute([$areaId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return (int)($result['total'] ?? 0);
    }
    
    
    public static function getCambioPorId($cambioId)
    {
        self::init();
        
        $sql = "SELECT lcn.*,
                       ac.nombre as area_nombre,
                       nc.nombre as nivel_nombre
                FROM log_cambios_notas lcn
                LEFT JOIN areas_competencia ac ON ac.id = lcn.area_competencia_id
                LEFT JOIN niveles_competencia nc ON nc.id = lcn.nivel_competencia_id
                WHERE lcn.id = ?";
        
        $stmt = self::$db->prepare($sql);
        $stmt->execute([$cambioId]);
        
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    
    public static function aprobarCambio($cambioId, $coordinadorId, $observaciones = null)
    {
        self::init();
        
        try {
            $sql = "UPDATE log_cambios_notas
                    SET estado_aprobacion = 'aprobado',
                        coordinador_id = ?,
                        fecha_revision = NOW(),
                        observaciones_coordinador = ?
                    WHERE id = ? AND estado_aprobacion = 'pendiente'";
            
            $stmt = self::$db->prepare($sql);
            $result = $stmt->execute([$coordinadorId, $observaciones, $cambioId]);
            
            if ($result && $stmt->rowCount() > 0) {
                error_log("LogCambiosNotas::aprobarCambio - Cambio $cambioId aprobado por coordinador $coordinadorId");
                return true;
            }
            
            return false;
        } catch (\Exception $e) {
            error_log("Error en LogCambiosNotas::aprobarCambio: " . $e->getMessage());
            return false;
        }
    }
    
    
    public static function rechazarCambio($cambioId, $coordinadorId, $observaciones = null)
    {
        self::init();
        
        try {
            
            $cambio = self::getCambioPorId($cambioId);
            
            if (!$cambio || $cambio['estado_aprobacion'] !== 'pendiente') {
                error_log("LogCambiosNotas::rechazarCambio - Cambio no encontrado o ya procesado. ID: $cambioId");
                return false;
            }
            
            
            $tipoEvaluacion = $cambio['tipo_evaluacion'] ?? 'clasificacion';
            if (!in_array($tipoEvaluacion, ['clasificacion', 'final'])) {
                error_log("LogCambiosNotas::rechazarCambio - Tipo de evaluación inválido: " . ($tipoEvaluacion ?? 'NULL'));
                $tipoEvaluacion = 'clasificacion'; 
            }
            
           
            if (empty($cambio['evaluacion_id'])) {
                error_log("LogCambiosNotas::rechazarCambio - evaluacion_id no encontrado en el cambio");
                return false;
            }
            
            self::$db->beginTransaction();
            
            try {
                
                
                $sql = "UPDATE log_cambios_notas
                        SET estado_aprobacion = 'rechazado',
                            coordinador_id = ?,
                            fecha_revision = NOW(),
                            observaciones_coordinador = ?
                        WHERE id = ?";
                
                $stmt = self::$db->prepare($sql);
                $stmt->execute([$coordinadorId, $observaciones, $cambioId]);
                
                if ($stmt->rowCount() === 0) {
                    throw new \Exception("No se pudo actualizar el estado del cambio");
                }
                
                
                $tablaEvaluacion = $tipoEvaluacion === 'final' 
                    ? 'evaluaciones_finales' 
                    : 'evaluaciones_clasificacion';
                
              
                $sqlVerificar = "SELECT id FROM {$tablaEvaluacion} WHERE id = ?";
                $stmtVerificar = self::$db->prepare($sqlVerificar);
                $stmtVerificar->execute([$cambio['evaluacion_id']]);
                $evaluacionExiste = $stmtVerificar->fetch(\PDO::FETCH_ASSOC);
                
                if (!$evaluacionExiste) {
                    error_log("LogCambiosNotas::rechazarCambio - La evaluación ID {$cambio['evaluacion_id']} no existe en la tabla $tablaEvaluacion");
                    
                    self::$db->commit();
                    error_log("LogCambiosNotas::rechazarCambio - Cambio $cambioId rechazado (nota no revertida - evaluación no existe)");
                    return true;
                }
                
              
                if ($tipoEvaluacion === 'final') {
                    $sqlRevertir = "UPDATE {$tablaEvaluacion}
                                   SET puntuacion = ?,
                                       observaciones = ?
                                   WHERE id = ?";
                } else {
                    $sqlRevertir = "UPDATE {$tablaEvaluacion}
                                   SET puntuacion = ?,
                                       observaciones = ?,
                                       updated_at = NOW()
                                   WHERE id = ?";
                }
                
                $stmtRevertir = self::$db->prepare($sqlRevertir);
                $notaAnterior = $cambio['nota_anterior'] ?? null;
                $observacionesAnterior = $cambio['observaciones_anterior'] ?? null;
                
                $stmtRevertir->execute([
                    $notaAnterior,
                    $observacionesAnterior,
                    $cambio['evaluacion_id']
                ]);
                
                if ($stmtRevertir->rowCount() === 0) {
                    error_log("LogCambiosNotas::rechazarCambio - No se pudo revertir la nota (ninguna fila afectada)");
                    
                } else {
                    error_log("LogCambiosNotas::rechazarCambio - Nota revertida exitosamente en tabla: $tablaEvaluacion");
                }
                
                self::$db->commit();
                error_log("LogCambiosNotas::rechazarCambio - Cambio $cambioId rechazado y nota revertida");
                return true;
                
            } catch (\Exception $e) {
                self::$db->rollBack();
                error_log("LogCambiosNotas::rechazarCambio - Error en transacción: " . $e->getMessage());
                error_log("LogCambiosNotas::rechazarCambio - Stack trace: " . $e->getTraceAsString());
                throw $e;
            }
            
        } catch (\Exception $e) {
            error_log("Error en LogCambiosNotas::rechazarCambio: " . $e->getMessage());
            error_log("LogCambiosNotas::rechazarCambio - Stack trace: " . $e->getTraceAsString());
            return false;
        }
    }
    
    
    public static function solicitarMasInfo($cambioId, $coordinadorId, $observaciones)
    {
        self::init();
        
        if (empty($observaciones)) {
            error_log("LogCambiosNotas::solicitarMasInfo - Observaciones requeridas");
            return false;
        }
        
        try {
            $sql = "UPDATE log_cambios_notas
                    SET coordinador_id = ?,
                        fecha_revision = NOW(),
                        observaciones_coordinador = ?,
                        notificacion_enviada = FALSE
                    WHERE id = ? AND estado_aprobacion = 'pendiente'";
            
            $stmt = self::$db->prepare($sql);
            $result = $stmt->execute([$coordinadorId, $observaciones, $cambioId]);
            
            if ($result && $stmt->rowCount() > 0) {
                error_log("LogCambiosNotas::solicitarMasInfo - Solicitud de más info para cambio $cambioId");
                return true;
            }
            
            return false;
        } catch (\Exception $e) {
            error_log("Error en LogCambiosNotas::solicitarMasInfo: " . $e->getMessage());
            return false;
        }
    }
    
    
    public static function revertirNota($evaluacionId, $notaAnterior, $observacionesAnterior = null, $tipoEvaluacion = 'clasificacion')
    {
        self::init();
        
       
        if (!in_array($tipoEvaluacion, ['clasificacion', 'final'])) {
            error_log("LogCambiosNotas::revertirNota - Tipo de evaluación inválido: $tipoEvaluacion");
            $tipoEvaluacion = 'clasificacion'; 
        }
        
        try {
            $tablaEvaluacion = $tipoEvaluacion === 'final' 
                ? 'evaluaciones_finales' 
                : 'evaluaciones_clasificacion';
            
            $sql = "UPDATE {$tablaEvaluacion}
                    SET puntuacion = ?,
                        observaciones = ?,
                        updated_at = NOW()
                    WHERE id = ?";
            
            $stmt = self::$db->prepare($sql);
            $result = $stmt->execute([$notaAnterior, $observacionesAnterior, $evaluacionId]);
            
            if ($result) {
                error_log("LogCambiosNotas::revertirNota - Nota revertida para evaluación $evaluacionId en tabla $tablaEvaluacion");
                return true;
            }
            
            return false;
        } catch (\Exception $e) {
            error_log("Error en LogCambiosNotas::revertirNota: " . $e->getMessage());
            return false;
        }
    }
    
    
    public static function tieneCambioPendiente($evaluacionId)
    {
        self::init();
        
        $sql = "SELECT COUNT(*) as total
                FROM log_cambios_notas
                WHERE evaluacion_id = ? AND estado_aprobacion = 'pendiente'";
        
        $stmt = self::$db->prepare($sql);
        $stmt->execute([$evaluacionId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return (int)($result['total'] ?? 0) > 0;
    }
}
