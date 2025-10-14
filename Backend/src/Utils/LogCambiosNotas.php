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
     */
    public static function registrarCambio($evaluacionId, $evaluadorId, $evaluadorNombre, $olimpistaId, $olimpistaNombre, $areaId, $areaNombre, $nivelId, $nivelNombre, $notaAnterior, $notaNueva, $observacionesAnterior = null, $observacionesNueva = null, $motivoCambio = null)
    {
        self::init();
        
        error_log("LogCambiosNotas::registrarCambio - Iniciando registro de cambio");
        error_log("Datos: EvaluacionId=$evaluacionId, EvaluadorId=$evaluadorId, OlimpistaId=$olimpistaId, Motivo=$motivoCambio");
        
        try {
            $sql = "INSERT INTO log_cambios_notas (
                evaluacion_id,
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
                fecha_cambio
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            
            $stmt = self::$db->prepare($sql);
            $result = $stmt->execute([
                $evaluacionId,
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
                error_log("LogCambiosNotas::registrarCambio - Cambio registrado exitosamente");
            } else {
                error_log("LogCambiosNotas::registrarCambio - Error al ejecutar la consulta");
            }
            
            return $result;
        } catch (\Exception $e) {
            error_log("Error en LogCambiosNotas::registrarCambio: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Obtener log de cambios por área (solo para coordinadores)
     */
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
        
        $whereClause = implode(' AND ', $where);
        
        $sql = "SELECT 
                    lcn.*,
                    ac.nombre as area_nombre,
                    nc.nombre as nivel_nombre
                FROM log_cambios_notas lcn
                LEFT JOIN areas_competencia ac ON ac.id = lcn.area_competencia_id
                LEFT JOIN niveles_competencia nc ON nc.id = lcn.nivel_competencia_id
                WHERE {$whereClause}
                ORDER BY lcn.fecha_cambio DESC";
        
        error_log("LogCambiosNotas::getCambiosPorArea - SQL: $sql");
        error_log("LogCambiosNotas::getCambiosPorArea - Params: " . json_encode($params));
        
        $stmt = self::$db->prepare($sql);
        $stmt->execute($params);
        
        $result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        error_log("LogCambiosNotas::getCambiosPorArea - Resultados encontrados: " . count($result));
        
        return $result;
    }
    
    /**
     * Obtener estadísticas de cambios por área
     */
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
                    MAX(lcn.fecha_cambio) as ultimo_cambio
                FROM log_cambios_notas lcn
                WHERE {$whereClause}";
        
        $stmt = self::$db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    /**
     * Obtener IP del cliente
     */
    private static function getClientIP()
    {
        $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
}
